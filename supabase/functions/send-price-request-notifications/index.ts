import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'new_request' | 'status_change';
  price_request_id: string;
  old_status?: string;
  new_status?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, price_request_id, old_status, new_status }: NotificationRequest = await req.json();
    
    console.log(`Processing notification: ${type} for request ${price_request_id}`);

    // Get the price request details with related data
    const { data: priceRequest, error: requestError } = await supabase
      .from('price_requests')
      .select(`
        *,
        project:projects(name, customer_name),
        lead:leads(first_name, last_name, company),
        assigned_estimator:team_members(name, email, user_id),
        requested_by_profile:profiles!price_requests_requested_by_user_id_fkey(full_name, email)
      `)
      .eq('id', price_request_id)
      .single();

    if (requestError || !priceRequest) {
      console.error('Error fetching price request:', requestError);
      return new Response(JSON.stringify({ error: 'Price request not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === 'new_request') {
      // Notify assigned estimator about new request
      if (priceRequest.assigned_estimator?.email) {
        const projectName = priceRequest.project?.name || 
                           `Lead: ${priceRequest.lead?.first_name} ${priceRequest.lead?.last_name}`;
        
        await resend.emails.send({
          from: "Pricing System <noreply@yourdomain.com>",
          to: [priceRequest.assigned_estimator.email],
          subject: "New Price Request Assigned",
          html: `
            <h2>New Price Request Assigned</h2>
            <p>Hello ${priceRequest.assigned_estimator.name?.split(' ')[0]},</p>
            <p>A new price request has been assigned to you:</p>
            <ul>
              <li><strong>Project:</strong> ${projectName}</li>
              <li><strong>Scope:</strong> ${priceRequest.scope_summary}</li>
              <li><strong>Due Date:</strong> ${priceRequest.due_date ? new Date(priceRequest.due_date).toLocaleDateString() : 'Not specified'}</li>
              <li><strong>Requested By:</strong> ${priceRequest.requested_by_profile?.full_name || 'Unknown'}</li>
            </ul>
            <p>Please log in to the pricing dashboard to review and work on this request.</p>
          `,
        });
        
        console.log(`New request notification sent to estimator: ${priceRequest.assigned_estimator.email}`);
      }
    } else if (type === 'status_change') {
      // Notify requester about status change
      if (priceRequest.requested_by_profile?.email) {
        const projectName = priceRequest.project?.name || 
                           `Lead: ${priceRequest.lead?.first_name} ${priceRequest.lead?.last_name}`;
        
        await resend.emails.send({
          from: "Pricing System <noreply@yourdomain.com>",
          to: [priceRequest.requested_by_profile.email],
          subject: "Price Request Status Update",
          html: `
            <h2>Price Request Status Update</h2>
            <p>Hello ${priceRequest.requested_by_profile.full_name?.split(' ')[0]},</p>
            <p>The status of your price request has been updated:</p>
            <ul>
              <li><strong>Project:</strong> ${projectName}</li>
              <li><strong>Scope:</strong> ${priceRequest.scope_summary}</li>
              <li><strong>Previous Status:</strong> ${old_status}</li>
              <li><strong>New Status:</strong> ${new_status}</li>
              <li><strong>Estimator:</strong> ${priceRequest.assigned_estimator?.name || 'Not assigned'}</li>
            </ul>
            ${new_status === 'Completed' ? 
              '<p>Your price request has been completed! Please check the pricing dashboard for details.</p>' :
              '<p>Please check the pricing dashboard for more details.</p>'
            }
          `,
        });
        
        console.log(`Status change notification sent to requester: ${priceRequest.requested_by_profile.email}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-price-request-notifications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);