import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, paymentMethod } = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Initialize Supabase with service role key for server operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error("Invoice not found");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ 
      email: invoice.customer_name.includes('@') ? invoice.customer_name : `${invoice.customer_name.replace(/\s+/g, '').toLowerCase()}@example.com`,
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        name: invoice.customer_name,
        email: invoice.customer_name.includes('@') ? invoice.customer_name : `${invoice.customer_name.replace(/\s+/g, '').toLowerCase()}@example.com`,
      });
      customerId = customer.id;
    }

    // Create Stripe checkout session for invoice payment with method-specific options
    const baseCents = Math.round((invoice.total || 0) * 100);
    const method = ['card', 'ach', 'bank_transfer'].includes(paymentMethod) ? paymentMethod : 'card';

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: `Payment for ${invoice.project_name || 'project'}`,
          },
          unit_amount: baseCents,
        },
        quantity: 1,
      },
    ];

    if (method === 'card') {
      const feeCents = Math.round(baseCents * 0.035);
      if (feeCents > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Credit card processing fee',
              description: '3.5% processing fee for card payments',
            },
            unit_amount: feeCents,
          },
          quantity: 1,
        });
      }
    }

    const sessionParams: any = {
      customer: customerId,
      payment_method_types:
        method === 'ach' ? ['us_bank_account'] :
        method === 'bank_transfer' ? ['customer_balance'] : ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/invoice-payment-success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
      cancel_url: `${req.headers.get("origin")}/invoices`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        payment_method: method,
      },
    };

    if (method === 'bank_transfer') {
      sessionParams.payment_method_options = {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'us_bank_transfer' },
        },
      };
    }

    if (method === 'ach') {
      sessionParams.payment_method_options = {
        us_bank_account: { verification_method: 'automatic' },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update invoice with Stripe session info
    await supabaseAdmin
      .from('invoices')
      .update({ 
        stripe_payment_intent_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing invoice payment:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});