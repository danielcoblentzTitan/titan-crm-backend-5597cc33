import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DesignSubmission {
  // Customer information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  
  // Design specifications
  buildingWidth: number;
  buildingLength: number;
  wallHeight: number;
  buildingUse?: string;
  timeline?: string;
  
  // Door specifications
  doors?: Array<{
    type: 'overhead' | 'entry';
    width?: number;
    height?: number;
    location?: string;
  }>;
  
  // Window specifications
  windows?: Array<{
    width?: number;
    height?: number;
    location?: string;
  }>;
  
  // Additional options
  options?: string[];
  leanTo?: boolean;
  barndominium?: boolean;
  interiorFinishing?: boolean;
  
  // Design data
  designData?: any; // 3D design configuration/layout
  designUrl?: string; // URL to saved design if available
  designScreenshot?: string; // Base64 screenshot if available
  
  // Additional info
  additionalInfo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n========================================');
    console.log('=== 3D DESIGNER WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================\n');

    // Parse the submission data
    const designData: DesignSubmission = await req.json();
    
    console.log('=== DESIGN SUBMISSION DATA ===');
    console.log(JSON.stringify(designData, null, 2));
    console.log('=== END DESIGN DATA ===\n');

    // Validate required fields
    if (!designData.firstName || !designData.lastName) {
      console.error('Missing required fields: firstName or lastName');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: first name and last name are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate estimated value using building dimensions
    let estimatedValue = 0;
    let squareFootage = 0;
    
    if (designData.buildingWidth && designData.buildingLength && designData.wallHeight) {
      const width = Number(designData.buildingWidth);
      const length = Number(designData.buildingLength);
      const height = Number(designData.wallHeight);
      
      if (!isNaN(width) && !isNaN(length) && !isNaN(height)) {
        squareFootage = width * length;
        
        try {
          // Use the actual estimate calculator from the system
          const { data: pricingItems } = await supabase
            .from('pricing_items')
            .select(`
              *,
              pricing_categories (
                id,
                name,
                description
              )
            `)
            .eq('is_active', true);

          if (pricingItems && pricingItems.length > 0) {
            // Basic calculation - you can enhance this with the actual calculator
            estimatedValue = Math.round(squareFootage * 175);
            console.log(`Calculated estimate: $${estimatedValue} for ${width}' x ${length}' x ${height}' building`);
          } else {
            // Fallback to basic calculation
            estimatedValue = Math.round(squareFootage * 175);
            console.log(`Using fallback calculation: $${estimatedValue}`);
          }
        } catch (error) {
          console.error('Error calculating estimate:', error);
          estimatedValue = Math.round(squareFootage * 175);
        }
      }
    }

    // Build comprehensive notes
    const notesSections = [];
    
    notesSections.push('=== 3D DESIGNER SUBMISSION ===');
    notesSections.push(`Customer used 3D Building Designer tool to create custom design`);
    notesSections.push('');
    
    if (designData.buildingWidth && designData.buildingLength) {
      notesSections.push(`Dimensions: ${designData.buildingWidth}' x ${designData.buildingLength}' (${squareFootage.toLocaleString()} sq ft)`);
    }
    
    if (designData.wallHeight) {
      notesSections.push(`Wall Height: ${designData.wallHeight}'`);
    }
    
    if (designData.buildingUse) {
      notesSections.push(`Building Use: ${designData.buildingUse}`);
    }
    
    if (designData.timeline) {
      notesSections.push(`Timeline: ${designData.timeline}`);
    }
    
    // Door specifications
    if (designData.doors && designData.doors.length > 0) {
      notesSections.push('');
      notesSections.push('Doors:');
      designData.doors.forEach((door, idx) => {
        const doorInfo = [];
        doorInfo.push(`  ${idx + 1}. ${door.type === 'overhead' ? 'Overhead' : 'Entry'} Door`);
        if (door.width && door.height) {
          doorInfo.push(`     Size: ${door.width}' x ${door.height}'`);
        }
        if (door.location) {
          doorInfo.push(`     Location: ${door.location}`);
        }
        notesSections.push(doorInfo.join('\n'));
      });
    }
    
    // Window specifications
    if (designData.windows && designData.windows.length > 0) {
      notesSections.push('');
      notesSections.push(`Windows: ${designData.windows.length} total`);
      designData.windows.forEach((window, idx) => {
        if (window.width && window.height) {
          notesSections.push(`  ${idx + 1}. ${window.width}' x ${window.height}'${window.location ? ` (${window.location})` : ''}`);
        }
      });
    }
    
    // Additional options
    if (designData.options && designData.options.length > 0) {
      notesSections.push('');
      notesSections.push(`Additional Options: ${designData.options.join(', ')}`);
    }
    
    if (designData.leanTo) {
      notesSections.push(`Lean-To: Yes`);
    }
    
    if (designData.barndominium) {
      notesSections.push(`Barndominium: Yes`);
    }
    
    if (designData.interiorFinishing) {
      notesSections.push(`Interior Finishing: Yes`);
    }
    
    if (designData.additionalInfo) {
      notesSections.push('');
      notesSections.push(`Additional Information: ${designData.additionalInfo}`);
    }
    
    if (designData.designUrl) {
      notesSections.push('');
      notesSections.push(`Design URL: ${designData.designUrl}`);
    }

    // Structure building specifications as JSON
    const buildingSpecs: Record<string, any> = {
      dimensions: {
        width: designData.buildingWidth,
        length: designData.buildingLength,
        height: designData.wallHeight,
        square_footage: squareFootage
      }
    };
    
    if (designData.doors && designData.doors.length > 0) {
      buildingSpecs.doors = {
        total_count: designData.doors.length,
        overhead_count: designData.doors.filter(d => d.type === 'overhead').length,
        entry_count: designData.doors.filter(d => d.type === 'entry').length,
        specifications: designData.doors
      };
    }
    
    if (designData.windows && designData.windows.length > 0) {
      buildingSpecs.windows = {
        count: designData.windows.length,
        specifications: designData.windows
      };
    }
    
    if (designData.options && designData.options.length > 0) {
      buildingSpecs.options = designData.options;
    }
    
    if (designData.buildingUse) {
      buildingSpecs.building_use = designData.buildingUse;
    }
    
    if (designData.leanTo) {
      buildingSpecs.lean_to = 'Yes';
    }
    
    if (designData.barndominium) {
      buildingSpecs.barndominium = 'Yes';
    }
    
    if (designData.interiorFinishing) {
      buildingSpecs.interior_finishing = 'Yes';
    }
    
    // Store the 3D design data
    if (designData.designData) {
      buildingSpecs.design_data = designData.designData;
    }
    
    if (designData.designUrl) {
      buildingSpecs.design_url = designData.designUrl;
    }

    // Map timeline to valid enum values
    let mappedTimeline = null;
    if (designData.timeline) {
      const timelineMap: Record<string, string> = {
        'Within 2 Months': '0-3 Months',
        'Within 6 Months': '3-6 Months', 
        'Within a Year': '6-12 Months',
        'More than a Year': '12+ Months',
        'ASAP': '0-3 Months',
        'Immediately': '0-3 Months',
        '0-3 Months': '0-3 Months',
        '3-6 Months': '3-6 Months',
        '6-12 Months': '6-12 Months',
        '12+ Months': '12+ Months'
      };
      mappedTimeline = timelineMap[designData.timeline] || designData.timeline;
    }

    // Create the lead object with "Leads With Design" source
    console.log('Creating lead data object...');
    const leadData = {
      first_name: designData.firstName,
      last_name: designData.lastName,
      email: designData.email || null,
      phone: designData.phone || null,
      company: designData.company || null,
      address: designData.address || null,
      city: designData.city || null,
      state: designData.state || null,
      zip: designData.zip || null,
      county: designData.county || null,
      source: 'Leads With Design - 3D Designer',
      status: 'New',
      stage: 'New',
      priority: 'High', // Higher priority since they used the designer
      building_type: designData.buildingUse || 'Residential',
      estimated_value: estimatedValue,
      timeline: mappedTimeline,
      deals_active: true,
      stage_entered_date: new Date().toISOString(),
      notes: notesSections.join('\n'),
      building_specifications: buildingSpecs
    };

    console.log('Creating lead with data:', leadData);

    // Insert the lead into the database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('Database error creating lead:', {
        error: leadError,
        code: leadError.code,
        message: leadError.message,
        details: leadError.details,
        hint: leadError.hint,
        leadData: leadData
      });
      throw leadError;
    }

    console.log('Lead created successfully:', lead.id);

    // If screenshot is provided, upload it to storage
    if (designData.designScreenshot && lead) {
      try {
        const base64Data = designData.designScreenshot.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `${lead.id}/design-screenshot-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading design screenshot:', uploadError);
        } else {
          console.log('Design screenshot uploaded successfully:', fileName);
          
          // Update lead with screenshot URL
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
            
          await supabase
            .from('leads')
            .update({ 
              building_specifications: {
                ...buildingSpecs,
                design_screenshot_url: publicUrl
              }
            })
            .eq('id', lead.id);
        }
      } catch (error) {
        console.error('Error processing design screenshot:', error);
      }
    }

    // Create an initial follow-up task
    const taskData = {
      lead_id: lead.id,
      task_type: 'call',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      notes: 'Initial contact - new 3D designer lead with custom design',
      is_automated: true
    };

    const { error: taskError } = await supabase
      .from('lead_follow_up_tasks')
      .insert(taskData);

    if (taskError) {
      console.warn('Error creating follow-up task:', taskError);
      // Don't fail the whole process if task creation fails
    }

    console.log('3D Designer webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead created successfully from 3D designer',
        lead_id: lead.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing 3D Designer webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: (error instanceof Error ? error.message : String(error)) 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
