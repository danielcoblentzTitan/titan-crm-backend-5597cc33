import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    console.log('Sending test invite to:', email);
    
    // Sample data for testing
    const customerName = "John Doe";
    const testInviteToken = "sample-invite-token-123";
    
    // Create invite URL - use the current domain from the request
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const inviteUrl = `${baseUrl}/login?invite=${testInviteToken}`;

    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY not configured'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Send test email with the same template as the real invitation
    const emailResponse = await resend.emails.send({
      from: 'Titan Buildings <onboarding@resend.dev>',
      to: [email],
      subject: '[TEST] Welcome to Your Titan Buildings Customer Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>[TEST] Welcome to Your Customer Portal</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #f9fafb 100%); min-height: 100vh;">
          <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            
            <!-- Test Notice -->
            <div style="background-color: #fff3cd; border-bottom: 2px solid #ffeaa7; padding: 15px; text-align: center;">
              <p style="margin: 0; color: #856404; font-weight: bold; font-size: 16px;">[TEST EMAIL]</p>
              <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">This is a test invitation to demonstrate the email format</p>
            </div>
            
            <!-- Header -->
            <div style="background-image: url('${baseUrl}/lovable-uploads/6b4edd15-4260-47fa-af32-9993b2f5f6d0.png'); background-size: cover; background-position: center; padding: 40px 30px; text-align: center;">
              <h1 style="color: #003562; margin: 0; font-size: 28px; font-weight: bold; line-height: 1.2;">
                Welcome to Your<br>
                <span style="font-size: 32px;">Customer Portal</span>
              </h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
                Hi ${customerName}!
              </h2>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                As a valued Titan Buildings customer, you now have exclusive access to track your project's progress, 
                communicate with your team, and access all your important documents in one secure location.
              </p>

              <!-- Benefits Grid -->
              <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: bold; text-align: center;">
                  Why Use Your Customer Portal?
                </h3>
                
                <div style="margin: 20px 0;">
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 8px; height: 8px; background-color: #003562; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">Real-Time Project Updates</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">See exactly where your project stands with live progress updates and photo documentation</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 8px; height: 8px; background-color: #003562; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">Track Your Timeline</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">View your project schedule, upcoming milestones, and estimated completion dates</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 8px; height: 8px; background-color: #003562; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">Access All Documents</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">Download contracts, permits, plans, and invoices anytime from your secure portal</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 8px; height: 8px; background-color: #003562; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">Direct Communication</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">Message your project team directly and get instant notifications on important updates</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 8px; height: 8px; background-color: #003562; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">Secure & Private</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">Your project information is protected with bank-level security and encryption</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
                    <div style="width: 8px; height: 8px; background-color: #003562; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">Mobile Access</strong>
                      <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">Check your project status on-the-go from any device, anywhere, anytime</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}" 
                   style="background: linear-gradient(135deg, #003562 0%, #004577 100%); 
                          color: white; 
                          padding: 16px 32px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block; 
                          font-size: 18px; 
                          font-weight: 600;
                          box-shadow: 0 4px 12px rgba(0, 53, 98, 0.3);
                          transition: all 0.3s ease;">
                  Access Your Portal Now
                </a>
              </div>

              <!-- What You'll Find -->
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">
                  Everything You Need in One Place
                </h3>
                <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0;">✓ Project Dashboard with current phase and completion percentage</p>
                  <p style="margin: 0 0 8px 0;">✓ Photo Gallery with progress documentation</p>
                  <p style="margin: 0 0 8px 0;">✓ Document Library with all contracts, permits, and invoices</p>
                  <p style="margin: 0;">✓ Communication Hub for direct team messaging</p>
                </div>
              </div>

              <!-- Test Notice -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                  <strong>Test Email Notice:</strong> This is a demonstration of the invitation format. The invite link above is not functional in test mode.
                </p>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
                This invitation will expire in 7 days. If you need assistance accessing your portal, please contact your project team.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 16px; font-weight: 500;">
                Titan Buildings
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px;">
                <span style="color: #dc2626; font-weight: 600;">your dream.</span> <span style="color: #1e3a8a; font-weight: 600;">our blueprint.</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Test email response:', emailResponse);

    // Handle Resend API errors gracefully
    if (emailResponse.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Email delivery restricted',
          details: 'Test emails can only be sent to verified domains. In production, please verify your domain at resend.com/domains',
          resend_error: emailResponse.error
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test invite sent successfully',
        email_id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error sending test invite:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);