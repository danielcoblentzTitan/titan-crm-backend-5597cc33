import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VendorEmailRequest {
  vendor_id: string;
  to_emails: string[];
  cc_emails?: string[];
  subject: string;
  body_html: string;
  body_text: string;
  object_type: string;
  object_id: string;
  attachments?: any[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      vendor_id,
      to_emails,
      cc_emails = [],
      subject,
      body_html,
      body_text,
      object_type,
      object_id,
      attachments = []
    }: VendorEmailRequest = await req.json();

    console.log('Sending email to vendor:', { vendor_id, to_emails, subject });

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Build Partners <daniel@titanbuildings.com>",
      to: to_emails,
      cc: cc_emails.length > 0 ? cc_emails : undefined,
      subject: subject,
      html: body_html,
      text: body_text,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the message in vendor_messages table
    const { error: logError } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id,
        object_id,
        object_type,
        direction: 'outbound',
        subject,
        body_html,
        body_text,
        to_emails,
        cc_emails,
        message_id: emailResponse.data?.id,
        status: 'Sent',
        delivered_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging email message:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-vendor-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);