import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

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
        assigned_estimator:team_members(name, email, user_id)
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

    const projectName = priceRequest.project?.name || 
                       `Lead: ${priceRequest.lead?.first_name} ${priceRequest.lead?.last_name}`;

    if (type === 'new_request') {
      // Create notification for assigned estimator about new request
      if (priceRequest.assigned_estimator?.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: priceRequest.assigned_estimator.user_id,
            title: 'New Price Request Assigned',
            message: `You have been assigned a new price request for ${projectName}`,
            type: 'price_request',
            related_id: price_request_id,
            read: false
          });
        
        console.log(`New request notification created for estimator: ${priceRequest.assigned_estimator.user_id}`);
      }
    } else if (type === 'status_change') {
      // Create notification for requester about status change
      if (priceRequest.requested_by_user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: priceRequest.requested_by_user_id,
            title: 'Price Request Status Updated',
            message: `Your price request for ${projectName} status changed from ${old_status} to ${new_status}`,
            type: 'price_request',
            related_id: price_request_id,
            read: false
          });
        
        console.log(`Status change notification created for requester: ${priceRequest.requested_by_user_id}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-in-app-notifications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);