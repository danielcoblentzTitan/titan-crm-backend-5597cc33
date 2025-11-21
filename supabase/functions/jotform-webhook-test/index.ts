import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    console.log('=== JOTFORM TEST WEBHOOK ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    // Try to get the raw body first
    const bodyText = await req.text();
    console.log('Raw body length:', bodyText.length);
    console.log('Raw body preview (first 500 chars):', bodyText.substring(0, 500));

    // Try to parse as different formats
    let parsedData = null;
    try {
      parsedData = JSON.parse(bodyText);
      console.log('Successfully parsed as JSON');
    } catch {
      console.log('Not valid JSON, checking URL encoded...');
      const params = new URLSearchParams(bodyText);
      const urlEncodedData: Record<string, any> = {};
      for (const [key, value] of params.entries()) {
        urlEncodedData[key] = value;
        console.log(`URL param: ${key} = ${value.substring(0, 100)}...`);
      }
      if (Object.keys(urlEncodedData).length > 0) {
        parsedData = urlEncodedData;
        console.log('Successfully parsed as URL encoded');
      }
    }

    console.log('Final parsed data:', JSON.stringify(parsedData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test webhook received successfully',
        bodyLength: bodyText.length,
        parsedKeys: parsedData ? Object.keys(parsedData) : []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Test webhook error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Test webhook failed', details: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});