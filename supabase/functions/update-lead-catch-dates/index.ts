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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get all leads that have notes but no first_contact_date
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, notes, first_contact_date, created_at')
      .not('notes', 'is', null)
      .neq('notes', '')
      .is('first_contact_date', null);

    if (fetchError) {
      throw new Error(`Error fetching leads: ${fetchError.message}`);
    }

    console.log(`Found ${leads?.length || 0} leads to process`);

    const updates = [];
    const processed = [];

    for (const lead of leads || []) {
      const catchDate = extractCatchDateFromNotes(lead.notes);
      
      if (catchDate) {
        console.log(`Found catch date ${catchDate} for lead ${lead.id}`);
        
        try {
          const { error: updateError } = await supabase
            .from('leads')
            .update({ first_contact_date: catchDate })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`Error updating lead ${lead.id}:`, updateError);
            updates.push({
              id: lead.id,
              success: false,
              error: updateError.message,
              extractedDate: catchDate
            });
          } else {
            updates.push({
              id: lead.id,
              success: true,
              extractedDate: catchDate
            });
          }
        } catch (error) {
          console.error(`Exception updating lead ${lead.id}:`, error);
          const message = error instanceof Error ? error.message : String(error);
          updates.push({
            id: lead.id,
            success: false,
            error: message,
            extractedDate: catchDate
          });
        }
      } else {
        processed.push({
          id: lead.id,
          hasCatchDate: false,
          notes: lead.notes.substring(0, 100) + '...'
        });
      }
    }

    const successCount = updates.filter(u => u.success).length;
    const errorCount = updates.filter(u => !u.success).length;

    console.log(`Processing complete. Updated: ${successCount}, Errors: ${errorCount}, No catch date found: ${processed.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalLeads: leads?.length || 0,
        updatedLeads: successCount,
        errors: errorCount,
        noDateFound: processed.length,
        updates,
        processed: processed.slice(0, 10) // Only return first 10 for brevity
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in update-lead-catch-dates:', error);
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

function extractCatchDateFromNotes(notes: string): string | null {
  if (!notes) return null;

  // Pattern 1: "Catch Date: YYYY-MM-DD" or "Catch Date: MM/DD/YYYY"
  const catchDatePattern = /catch\s+date\s*:\s*([0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i;
  const catchMatch = notes.match(catchDatePattern);
  
  if (catchMatch) {
    return standardizeDate(catchMatch[1]);
  }

  // Pattern 2: "Contact Date: YYYY-MM-DD" or "Contact Date: MM/DD/YYYY"
  const contactDatePattern = /contact\s+date\s*:\s*([0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i;
  const contactMatch = notes.match(contactDatePattern);
  
  if (contactMatch) {
    return standardizeDate(contactMatch[1]);
  }

  // Pattern 3: "First Contact: YYYY-MM-DD" or "First Contact: MM/DD/YYYY"
  const firstContactPattern = /first\s+contact\s*:\s*([0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/i;
  const firstMatch = notes.match(firstContactPattern);
  
  if (firstMatch) {
    return standardizeDate(firstMatch[1]);
  }

  // Pattern 4: Look for any date in "Key: Date" format where key contains catch/contact
  const keyValuePattern = /([^:\n]*(?:catch|contact)[^:\n]*)\s*:\s*([0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/gi;
  const keyValueMatch = notes.match(keyValuePattern);
  
  if (keyValueMatch && keyValueMatch.length > 0) {
    const fullMatch = keyValueMatch[0];
    const dateMatch = fullMatch.match(/([0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/);
    if (dateMatch) {
      return standardizeDate(dateMatch[1]);
    }
  }

  return null;
}

function standardizeDate(dateStr: string): string | null {
  try {
    let date: Date;
    
    if (dateStr.includes('/')) {
      // Handle MM/DD/YYYY format
      const [month, day, year] = dateStr.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Handle YYYY-MM-DD format
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}