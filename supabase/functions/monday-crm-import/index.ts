import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mondayApiKey = Deno.env.get('MONDAY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!mondayApiKey) {
      throw new Error('Monday.com API key not configured');
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { action, boardId, workspaceId, columnMappings, preserveUnmapped } = await req.json();

    console.log('Monday CRM Import Request:', { action, boardId, workspaceId, columnMappings, preserveUnmapped });

    switch (action) {
      case 'getWorkspaces':
        return await getWorkspaces(mondayApiKey);
      
      case 'getBoards':
        return await getBoards(mondayApiKey, workspaceId);
      
      case 'importLeads':
        return await importLeads(mondayApiKey, boardId, supabase);
      
      case 'importLeadsAdvanced':
        return await importLeadsAdvanced(mondayApiKey, boardId, supabase, columnMappings, preserveUnmapped);
      
      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Error in Monday CRM import:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function getWorkspaces(apiKey: string) {
  const query = `
    query {
      workspaces {
        id
        name
        description
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Monday.com API error: ${data.errors[0].message}`);
  }

  return new Response(
    JSON.stringify({ workspaces: data.data.workspaces }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function getBoards(apiKey: string, workspaceId?: string) {
  const query = `
    query {
      boards(workspace_ids: ${workspaceId ? `[${workspaceId}]` : '[]'}) {
        id
        name
        description
        workspace_id
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Monday.com API error: ${data.errors[0].message}`);
  }

  return new Response(
    JSON.stringify({ boards: data.data.boards }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function importLeads(apiKey: string, boardId: string, supabase: any) {
  console.log('Importing leads from board:', boardId);

  // First, get board structure to understand columns
  const boardQuery = `
    query {
      boards(ids: [${boardId}]) {
        id
        name
        columns {
          id
          title
          type
        }
        items_page {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: boardQuery }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Monday.com API error: ${data.errors[0].message}`);
  }

  const board = data.data.boards[0];
  if (!board) {
    throw new Error('Board not found');
  }

  const items = board.items_page.items;
  const columns = board.columns;
  
  console.log(`Found ${items.length} items in board "${board.name}"`);

  const importedLeads = [];
  const errors = [];

  for (const item of items) {
    try {
      const leadData = parseLeadFromItem(item, columns);
      
      // Insert lead into Supabase
      const { data: insertedLead, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting lead:', error);
        errors.push({
          itemName: item.name,
          error: error.message
        });
      } else {
        importedLeads.push(insertedLead);
        console.log('Successfully imported lead:', insertedLead.first_name, insertedLead.last_name);
      }
    } catch (error) {
      console.error('Error processing item:', item.name, error);
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        itemName: item.name,
        error: message
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      imported: importedLeads.length,
      errors: errors.length,
      details: {
        importedLeads,
        errors
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function parseLeadFromItem(item: any, columns: any[]) {
  const columnValues = item.column_values;
  
  // Create a map for easier column lookup
  const columnMap = new Map();
  columns.forEach(col => {
    columnMap.set(col.id, col);
  });

  const valueMap = new Map();
  columnValues.forEach((cv: any) => {
    valueMap.set(cv.id, cv);
  });

  // Extract common lead fields - this is a basic mapping
  // You may need to adjust based on your Monday.com board structure
  const leadData: any = {
    source: 'Monday.com Import',
    stage: 'New',
    created_at: new Date().toISOString(),
  };

  // Parse the item name as full name
  const fullName = item.name || '';
  const nameParts = fullName.split(' ');
  leadData.first_name = nameParts[0] || 'Unknown';
  leadData.last_name = nameParts.slice(1).join(' ') || '';

  // Map common column types to lead fields
  for (const [columnId, columnInfo] of columnMap) {
    const value = valueMap.get(columnId);
    
    if (!value || !value.text) continue;

    const columnTitle = columnInfo.title.toLowerCase();
    const columnType = columnInfo.type;
    const text = value.text;

    // Map based on column titles (customize based on your board)
    if (columnTitle.includes('email')) {
      leadData.email = text;
    } else if (columnTitle.includes('phone')) {
      leadData.phone = text;
    } else if (columnTitle.includes('company')) {
      leadData.company = text;
    } else if (columnTitle.includes('address')) {
      leadData.address = text;
    } else if (columnTitle.includes('city')) {
      leadData.city = text;
    } else if (columnTitle.includes('state')) {
      leadData.state = text;
    } else if (columnTitle.includes('zip')) {
      leadData.zip = text;
    } else if (columnTitle.includes('status') || columnTitle.includes('stage')) {
      leadData.stage = mapMondayStatusToLeadStage(text);
    } else if (columnTitle.includes('value') || columnTitle.includes('budget')) {
      const numericValue = parseFloat(text.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numericValue)) {
        leadData.estimated_value = numericValue;
      }
    } else if (columnTitle.includes('note') || columnTitle.includes('description')) {
      leadData.notes = text;
    }
  }

  // Set default values for required fields if not present
  if (!leadData.email) {
    leadData.email = `noemail+${Date.now()}@monday-import.com`;
  }

  return leadData;
}

function mapMondayStatusToLeadStage(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('new') || statusLower.includes('fresh')) {
    return 'New';
  } else if (statusLower.includes('contact') || statusLower.includes('working')) {
    return 'Working';
  } else if (statusLower.includes('quote') || statusLower.includes('proposal')) {
    return 'Quoted';
  } else if (statusLower.includes('won') || statusLower.includes('closed') || statusLower.includes('success')) {
    return 'Won';
  } else if (statusLower.includes('lost') || statusLower.includes('dead')) {
    return 'Lost';
  }
  
  return 'New'; // Default fallback
}

async function importLeadsAdvanced(apiKey: string, boardId: string, supabase: any, columnMappings: any[], preserveUnmapped: boolean) {
  console.log('Advanced import with column mappings:', columnMappings);

  // Get board data
  const boardQuery = `
    query {
      boards(ids: [${boardId}]) {
        id
        name
        columns {
          id
          title
          type
        }
        items_page {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: boardQuery }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Monday.com API error: ${data.errors[0].message}`);
  }

  const board = data.data.boards[0];
  if (!board) {
    throw new Error('Board not found');
  }

  const items = board.items_page.items;
  const columns = board.columns;
  
  console.log(`Found ${items.length} items in board "${board.name}"`);

  const importedLeads = [];
  const errors = [];

  // Create mapping lookup
  const mappingLookup = new Map();
  columnMappings.forEach(mapping => {
    if (mapping.leadField && mapping.leadField !== 'unmapped') {
      mappingLookup.set(mapping.mondayColumnId, mapping);
    }
  });

  for (const item of items) {
    try {
      const leadData = parseLeadFromItemAdvanced(item, columns, mappingLookup, preserveUnmapped);
      
      // Insert lead into Supabase
      const { data: insertedLead, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting lead:', error);
        errors.push({
          itemName: item.name,
          error: error.message
        });
      } else {
        importedLeads.push(insertedLead);
        console.log('Successfully imported lead:', insertedLead.first_name, insertedLead.last_name);
      }
    } catch (error) {
      console.error('Error processing item:', item.name, error);
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        itemName: item.name,
        error: message
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      imported: importedLeads.length,
      errors: errors.length,
      details: {
        importedLeads,
        errors
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

function parseLeadFromItemAdvanced(item: any, columns: any[], mappingLookup: Map<string, any>, preserveUnmapped: boolean) {
  const columnValues = item.column_values;
  
  // Create a map for easier column lookup
  const columnMap = new Map();
  columns.forEach(col => {
    columnMap.set(col.id, col);
  });

  const valueMap = new Map();
  columnValues.forEach((cv: any) => {
    valueMap.set(cv.id, cv);
  });

  // Start with default lead data
  const leadData: any = {
    source: 'Monday.com Import',
    stage: 'New',
    created_at: new Date().toISOString(),
    deals_active: true,
  };

  // Handle item name if no specific first/last name mapping
  const hasFirstNameMapping = Array.from(mappingLookup.values()).some(m => m.leadField === 'first_name');
  const hasLastNameMapping = Array.from(mappingLookup.values()).some(m => m.leadField === 'last_name');
  
  if (!hasFirstNameMapping || !hasLastNameMapping) {
    const fullName = item.name || '';
    const nameParts = fullName.split(' ');
    if (!hasFirstNameMapping) leadData.first_name = nameParts[0] || 'Unknown';
    if (!hasLastNameMapping) leadData.last_name = nameParts.slice(1).join(' ') || '';
  }

  const unmappedData: any = {};

  // Process mapped columns
  for (const [columnId, mapping] of mappingLookup) {
    const value = valueMap.get(columnId);
    if (!value || !value.text) continue;

    const transformedValue = transformValue(value.text, value.value, mapping.transform);
    if (transformedValue !== null && transformedValue !== undefined) {
      leadData[mapping.leadField] = transformedValue;
    }
  }

  // Collect unmapped data if preserveUnmapped is true
  if (preserveUnmapped) {
    for (const [columnId, columnInfo] of columnMap) {
      if (!mappingLookup.has(columnId)) {
        const value = valueMap.get(columnId);
        if (value && value.text) {
          unmappedData[columnInfo.title] = value.text;
        }
      }
    }

    // Add unmapped data to notes and extract catch date if present
    if (Object.keys(unmappedData).length > 0) {
      const unmappedText = Object.entries(unmappedData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      // Try to extract catch date from unmapped data if not already mapped
      if (!leadData.first_contact_date) {
        for (const [key, value] of Object.entries(unmappedData)) {
          if (key.toLowerCase().includes('catch') && key.toLowerCase().includes('date')) {
            const parsedDate = tryParseDate(value as string);
            if (parsedDate) {
              leadData.first_contact_date = parsedDate;
              break;
            }
          }
        }
      }
      
      leadData.notes = leadData.notes 
        ? `${leadData.notes}\n\n--- Imported Data ---\n${unmappedText}`
        : unmappedText;
    }
  }

  // Ensure required fields
  if (!leadData.first_name) leadData.first_name = 'Unknown';
  if (!leadData.last_name) leadData.last_name = '';
  if (!leadData.email) {
    leadData.email = `noemail+${Date.now()}@monday-import.com`;
  }

  return leadData;
}

function tryParseDate(text: string): string | null {
  if (!text) return null;
  try {
    const date = new Date(text);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

function transformValue(text: string, rawValue: any, transform?: string): any {
  if (!text) return null;

  switch (transform) {
    case 'split_name':
      // Return just the first part for first name, or full text for last name
      const parts = text.split(' ');
      return parts[0] || text;
    
    case 'parse_number':
      const numericValue = parseFloat(text.replace(/[^0-9.-]+/g, ''));
      return isNaN(numericValue) ? 0 : numericValue;
    
    case 'parse_date':
      try {
        const date = new Date(text);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      } catch {
        return null;
      }
    
    case 'map_status':
      return mapMondayStatusToLeadStage(text);
    
    case 'none':
    default:
      // Handle boolean values
      if (text.toLowerCase() === 'true' || text.toLowerCase() === 'false') {
        return text.toLowerCase() === 'true';
      }
      
      // Handle timeline enum mapping
      const timelineMap: { [key: string]: string } = {
        '1-2 Years': '12+ Months',
        '1-2 years': '12+ Months',
        '2+ Years': '12+ Months',
        '2+ years': '12+ Months',
        'ASAP': '0-3 Months',
        'Immediately': '0-3 Months',
        'This Year': '6-12 Months',
        'Next Year': '12+ Months'
      };
      
      if (timelineMap[text]) {
        return timelineMap[text];
      }
      
      return text;
  }
}