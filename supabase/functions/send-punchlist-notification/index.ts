import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface NotificationRequest {
  type: 'test' | 'item_created' | 'item_completed' | 'overdue_items' | 'status_changed' | 'comment_added';
  email: string;
  project_id: string;
  message: string;
  item_data?: any;
  project_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      type, 
      email, 
      project_id, 
      message, 
      item_data,
      project_name 
    }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${email} for project ${project_id}`);

    // Get project details if not provided
    let projectDetails = null;
    if (!project_name) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name, customer_name')
        .eq('id', project_id)
        .single();

      if (!projectError) {
        projectDetails = project;
      }
    }

    const displayProjectName = project_name || projectDetails?.name || 'Your Project';

    // Generate email content based on type
    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'test':
        subject = 'Test Notification - Punchlist System';
        htmlContent = `
          <h2>Test Notification</h2>
          <p>${message}</p>
          <p>This is a test notification from your punchlist management system.</p>
          <p><strong>Project:</strong> ${displayProjectName}</p>
        `;
        break;

      case 'item_created':
        subject = `New Punchlist Item - ${displayProjectName}`;
        htmlContent = `
          <h2>New Punchlist Item Created</h2>
          <p>A new item has been added to the punchlist for <strong>${displayProjectName}</strong>.</p>
          ${item_data ? `
            <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
              <h3>${item_data.description}</h3>
              <p><strong>Location:</strong> ${item_data.location}</p>
              <p><strong>Priority:</strong> ${item_data.priority}</p>
              <p><strong>Status:</strong> ${item_data.status}</p>
              ${item_data.due_date ? `<p><strong>Due Date:</strong> ${new Date(item_data.due_date).toLocaleDateString()}</p>` : ''}
              ${item_data.assigned_to_vendor ? `<p><strong>Assigned to:</strong> ${item_data.assigned_to_vendor}</p>` : ''}
            </div>
          ` : ''}
          <p>${message}</p>
        `;
        break;

      case 'item_completed':
        subject = `Punchlist Item Completed - ${displayProjectName}`;
        htmlContent = `
          <h2>Punchlist Item Completed</h2>
          <p>An item has been marked as completed for <strong>${displayProjectName}</strong>.</p>
          ${item_data ? `
            <div style="border: 1px solid #10b981; padding: 15px; margin: 10px 0; border-radius: 5px; background-color: #f0fdf4;">
              <h3>✅ ${item_data.description}</h3>
              <p><strong>Location:</strong> ${item_data.location}</p>
              <p><strong>Priority:</strong> ${item_data.priority}</p>
              <p><strong>Completed:</strong> ${item_data.completed_at ? new Date(item_data.completed_at).toLocaleDateString() : 'Just now'}</p>
            </div>
          ` : ''}
          <p>${message}</p>
        `;
        break;

      case 'overdue_items':
        subject = `Overdue Punchlist Items - ${displayProjectName}`;
        htmlContent = `
          <h2>⚠️ Overdue Punchlist Items</h2>
          <p>Some items in the punchlist for <strong>${displayProjectName}</strong> are overdue.</p>
          <p style="color: #ef4444; font-weight: bold;">${message}</p>
          <p>Please review these items and update their status or due dates as needed.</p>
        `;
        break;

      case 'status_changed':
        subject = `Punchlist Status Update - ${displayProjectName}`;
        htmlContent = `
          <h2>Punchlist Status Updated</h2>
          <p>An item status has been updated for <strong>${displayProjectName}</strong>.</p>
          ${item_data ? `
            <div style="border: 1px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 5px; background-color: #fffbeb;">
              <h3>${item_data.description}</h3>
              <p><strong>Location:</strong> ${item_data.location}</p>
              <p><strong>New Status:</strong> ${item_data.status}</p>
              <p><strong>Priority:</strong> ${item_data.priority}</p>
            </div>
          ` : ''}
          <p>${message}</p>
        `;
        break;

      case 'comment_added':
        subject = `New Comment - ${displayProjectName}`;
        htmlContent = `
          <h2>New Comment Added</h2>
          <p>A new comment has been added to a punchlist item for <strong>${displayProjectName}</strong>.</p>
          ${item_data ? `
            <div style="border: 1px solid #3b82f6; padding: 15px; margin: 10px 0; border-radius: 5px; background-color: #eff6ff;">
              <h3>${item_data.description}</h3>
              <p><strong>Location:</strong> ${item_data.location}</p>
              <p><strong>Comment:</strong> ${item_data.comment_text}</p>
              <p><strong>By:</strong> ${item_data.author_name}</p>
            </div>
          ` : ''}
          <p>${message}</p>
        `;
        break;

      default:
        subject = `Punchlist Notification - ${displayProjectName}`;
        htmlContent = `
          <h2>Punchlist Notification</h2>
          <p>${message}</p>
          <p><strong>Project:</strong> ${displayProjectName}</p>
        `;
    }

    // Add footer to all emails
    htmlContent += `
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from your punchlist management system.<br>
        Project: ${displayProjectName}
      </p>
    `;

    const emailResponse = await resend.emails.send({
      from: 'Punchlist System <noreply@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Notification error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});