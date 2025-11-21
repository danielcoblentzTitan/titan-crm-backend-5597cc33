import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InboundEmailData {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: string;
    content_type: string;
  }>;
  headers: {
    'message-id': string;
    'in-reply-to'?: string;
    'references'?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const emailData: InboundEmailData = await req.json();
    
    // Parse email to determine object type and ID
    const { objectType, objectId, vendorId } = await parseEmailContext(emailData, supabase);
    
    if (!objectType || !objectId || !vendorId) {
      console.log('Could not determine email context, storing as unassigned');
      return new Response(
        JSON.stringify({ error: "Could not determine email context" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse email commands from body
    const commands = parseEmailCommands(emailData.text || emailData.html);
    
    // Store message in database
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .insert({
        object_type: objectType,
        object_id: objectId,
        vendor_id: vendorId,
        direction: 'Inbound',
        subject: emailData.subject,
        body_html: emailData.html,
        body_text: emailData.text,
        from_email: emailData.from,
        to_emails: emailData.to,
        cc_emails: emailData.cc || [],
        message_id: emailData.headers['message-id'],
        in_reply_to: emailData.headers['in-reply-to'],
        parsed_commands: commands,
        status: 'Parsed',
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to store message: ${messageError.message}`);
    }

    // Process commands and update object status
    await processEmailCommands(commands, objectType, objectId, supabase);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: message.id,
        commands_processed: commands.length 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in process-vendor-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function parseEmailContext(emailData: InboundEmailData, supabase: any) {
  // Try to parse from alias in To/CC
  const allRecipients = [...emailData.to, ...(emailData.cc || [])];
  
  for (const recipient of allRecipients) {
    if (recipient.includes('@titanbuildings.com')) {
      const match = recipient.match(/^(vendor|rfq|po|sched|chg|svc)\+([^@]+)@/);
      if (match) {
        const [, prefix, code] = match;
        
        if (prefix === 'vendor') {
          const { data: vendor } = await supabase
            .from('vendors_new')
            .select('id')
            .eq('code', code)
            .single();
          return { objectType: 'vendor', objectId: vendor?.id, vendorId: vendor?.id };
        } else {
          const tableName = getTableName(prefix);
          const { data: object } = await supabase
            .from(tableName)
            .select('id, vendor_id')
            .eq('code', code)
            .single();
          return { objectType: prefix, objectId: object?.id, vendorId: object?.vendor_id };
        }
      }
    }
  }

  // Try to parse from subject tokens
  const subjectMatch = emailData.subject.match(/\[(RFQ|PO|SCH|CHG|SV)-(\d+)\]/);
  if (subjectMatch) {
    const [, prefix, number] = subjectMatch;
    const code = `${prefix}-${number.padStart(3, '0')}`;
    const tableName = getTableName(prefix.toLowerCase());
    
    const { data: object } = await supabase
      .from(tableName)
      .select('id, vendor_id')
      .eq('code', code)
      .single();
    
    return { objectType: prefix.toLowerCase(), objectId: object?.id, vendorId: object?.vendor_id };
  }

  // Try to match by In-Reply-To header
  if (emailData.headers['in-reply-to']) {
    const { data: originalMessage } = await supabase
      .from('vendor_messages')
      .select('object_type, object_id, vendor_id')
      .eq('message_id', emailData.headers['in-reply-to'])
      .single();
    
    if (originalMessage) {
      return {
        objectType: originalMessage.object_type,
        objectId: originalMessage.object_id,
        vendorId: originalMessage.vendor_id
      };
    }
  }

  return { objectType: null, objectId: null, vendorId: null };
}

function parseEmailCommands(body: string): Array<{ command: string; value?: string }> {
  const commands: Array<{ command: string; value?: string }> = [];
  const lines = body.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim().toUpperCase();
    
    // ACK command
    if (trimmed === 'ACK' || trimmed === 'ACKNOWLEDGED') {
      commands.push({ command: 'ACK' });
    }
    
    // QUOTE command
    const quoteMatch = trimmed.match(/QUOTE[\s:]*\$?([\d,]+(?:\.\d{2})?)/);
    if (quoteMatch) {
      commands.push({ command: 'QUOTE', value: quoteMatch[1].replace(/,/g, '') });
    }
    
    // DATE command
    const dateMatch = trimmed.match(/DATE[\s:]*(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      commands.push({ command: 'DATE', value: dateMatch[1] });
    }
    
    // COST command
    const costMatch = trimmed.match(/COST[\s:]*\$?([\d,]+(?:\.\d{2})?)/);
    if (costMatch) {
      commands.push({ command: 'COST', value: costMatch[1].replace(/,/g, '') });
    }
    
    // LEAD command
    const leadMatch = trimmed.match(/LEAD[\s:]*(\d+)/);
    if (leadMatch) {
      commands.push({ command: 'LEAD', value: leadMatch[1] });
    }
    
    // YES/NO commands
    if (trimmed === 'YES' || trimmed === 'CONFIRMED') {
      commands.push({ command: 'YES' });
    }
    if (trimmed === 'NO' || trimmed === 'DECLINED') {
      commands.push({ command: 'NO' });
    }
    
    // Compliance attachments
    if (trimmed.includes('COI ATTACHED')) {
      commands.push({ command: 'COI_ATTACHED' });
    }
    if (trimmed.includes('LICENSE ATTACHED')) {
      commands.push({ command: 'LICENSE_ATTACHED' });
    }
  }
  
  return commands;
}

async function processEmailCommands(
  commands: Array<{ command: string; value?: string }>,
  objectType: string,
  objectId: string,
  supabase: any
) {
  const tableName = getTableName(objectType);
  
  for (const { command, value } of commands) {
    try {
      switch (command) {
        case 'ACK':
          await supabase
            .from(tableName)
            .update({ status: 'Acknowledged' })
            .eq('id', objectId);
          break;
          
        case 'QUOTE':
          if (objectType === 'rfq' && value) {
            await supabase
              .from('rfqs')
              .update({ 
                status: 'Quoted',
                quote_amount: parseFloat(value)
              })
              .eq('id', objectId);
          }
          break;
          
        case 'DATE':
          if (objectType === 'schedule' && value) {
            await supabase
              .from('schedule_requests')
              .update({ 
                status: 'Confirmed',
                confirmed_date: value
              })
              .eq('id', objectId);
          } else if (objectType === 'po' && value) {
            await supabase
              .from('purchase_orders')
              .update({ target_delivery: value })
              .eq('id', objectId);
          }
          break;
          
        case 'COST':
          if (objectType === 'change' && value) {
            await supabase
              .from('change_requests_vendor')
              .update({ cost_impact: parseFloat(value) })
              .eq('id', objectId);
          }
          break;
          
        case 'YES':
          if (objectType === 'change') {
            await supabase
              .from('change_requests_vendor')
              .update({ status: 'Approved' })
              .eq('id', objectId);
          }
          break;
          
        case 'NO':
          if (objectType === 'change') {
            await supabase
              .from('change_requests_vendor')
              .update({ status: 'Declined' })
              .eq('id', objectId);
          } else if (objectType === 'rfq') {
            await supabase
              .from('rfqs')
              .update({ status: 'Declined' })
              .eq('id', objectId);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to process command ${command}:`, error);
    }
  }
}

function getTableName(objectType: string): string {
  switch (objectType) {
    case 'rfq': return 'rfqs';
    case 'po': return 'purchase_orders';
    case 'schedule': 
    case 'sched': return 'schedule_requests';
    case 'change':
    case 'chg': return 'change_requests_vendor';
    case 'warranty':
    case 'svc': return 'warranty_tickets';
    default: return 'vendors_new';
  }
}

serve(handler);