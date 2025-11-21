import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Get overdue invoices (due date has passed)
    const { data: overdueInvoices, error: overdueError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(email, name)
      `)
      .eq('status', 'Sent')
      .lt('due_date', today.toISOString().split('T')[0])
      .not('customers.email', 'is', null);

    if (overdueError) {
      console.error('Error fetching overdue invoices:', overdueError);
    }

    // Get invoices due soon (within 3 days)
    const { data: dueSoonInvoices, error: dueSoonError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers!inner(email, name)
      `)
      .eq('status', 'Sent')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
      .not('customers.email', 'is', null);

    if (dueSoonError) {
      console.error('Error fetching due soon invoices:', dueSoonError);
    }

    const sentReminders = [];

    // Send overdue reminders
    if (overdueInvoices && overdueInvoices.length > 0) {
      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.floor((today.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if we've already sent a reminder for this invoice recently
        const { data: existingReminder } = await supabase
          .from('payment_reminders')
          .select('*')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', 'overdue')
          .gte('sent_at', new Date(today.getTime() - (24 * 60 * 60 * 1000)).toISOString()) // within last 24 hours
          .limit(1);

        if (existingReminder && existingReminder.length > 0) {
          continue; // Skip if reminder already sent recently
        }

        try {
          const emailResponse = await resend.emails.send({
            from: "Invoices <invoices@resend.dev>",
            to: [invoice.customers.email],
            subject: `Payment Overdue - Invoice ${invoice.invoice_number}`,
            html: `
              <h2>Payment Reminder</h2>
              <p>Dear ${invoice.customers.name},</p>
              <p>This is a friendly reminder that your payment for Invoice ${invoice.invoice_number} is now <strong>${daysOverdue} days overdue</strong>.</p>
              
              <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                <p><strong>Amount Due:</strong> $${invoice.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                <p><strong>Project:</strong> ${invoice.project_name || 'N/A'}</p>
              </div>
              
              <p>Please remit payment as soon as possible to avoid any service interruptions.</p>
              <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
              
              <p>Thank you for your business.</p>
              <p>Best regards,<br>Your Building Team</p>
            `,
          });

          // Record the reminder
          await supabase.from('payment_reminders').insert({
            invoice_id: invoice.id,
            reminder_type: 'overdue',
            days_overdue: daysOverdue,
            email_sent: true
          });

          sentReminders.push({
            type: 'overdue',
            invoice: invoice.invoice_number,
            customer: invoice.customers.name,
            daysOverdue
          });

        } catch (emailError) {
          console.error(`Failed to send overdue reminder for invoice ${invoice.invoice_number}:`, emailError);
        }
      }
    }

    // Send due soon reminders
    if (dueSoonInvoices && dueSoonInvoices.length > 0) {
      for (const invoice of dueSoonInvoices) {
        const daysUntilDue = Math.floor((new Date(invoice.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if we've already sent a due soon reminder
        const { data: existingReminder } = await supabase
          .from('payment_reminders')
          .select('*')
          .eq('invoice_id', invoice.id)
          .eq('reminder_type', 'due_soon')
          .limit(1);

        if (existingReminder && existingReminder.length > 0) {
          continue; // Skip if reminder already sent
        }

        try {
          const emailResponse = await resend.emails.send({
            from: "Invoices <invoices@resend.dev>",
            to: [invoice.customers.email],
            subject: `Payment Due Soon - Invoice ${invoice.invoice_number}`,
            html: `
              <h2>Payment Reminder</h2>
              <p>Dear ${invoice.customers.name},</p>
              <p>This is a friendly reminder that your payment for Invoice ${invoice.invoice_number} is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong>.</p>
              
              <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                <p><strong>Amount Due:</strong> $${invoice.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
                <p><strong>Project:</strong> ${invoice.project_name || 'N/A'}</p>
              </div>
              
              <p>Please ensure payment is submitted by the due date to avoid any late fees.</p>
              <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
              
              <p>Thank you for your business.</p>
              <p>Best regards,<br>Your Building Team</p>
            `,
          });

          // Record the reminder
          await supabase.from('payment_reminders').insert({
            invoice_id: invoice.id,
            reminder_type: 'due_soon',
            days_overdue: 0,
            email_sent: true
          });

          sentReminders.push({
            type: 'due_soon',
            invoice: invoice.invoice_number,
            customer: invoice.customers.name,
            daysUntilDue
          });

        } catch (emailError) {
          console.error(`Failed to send due soon reminder for invoice ${invoice.invoice_number}:`, emailError);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      remindersSent: sentReminders.length,
      details: sentReminders
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-payment-reminders:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});