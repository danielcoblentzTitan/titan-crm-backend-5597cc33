import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, customerName, conversationHistory } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context
    const systemPrompt = `You are an AI assistant for Titan Buildings, a construction company specializing in steel buildings, pole buildings, and barndominiums in Delaware and Maryland.

Company Information:
- Website: buildatitan.com
- Services: Steel buildings, pole buildings, barndominiums, commercial structures
- Service areas: Delaware and Maryland
- Phone: (302) 309-9475
- Email: info@buildatitan.com

Key Features & Benefits:
- Expert in steel frame and pole building construction
- Custom barndominium design and construction
- 3D design services for visualization
- Comprehensive project management from permits to completion
- Energy-efficient building solutions
- Durable, long-lasting structures (50+ year lifespan)
- Complete turnkey service including site preparation
- Various financing options available
- 4-8 week typical construction timeline

Your role:
1. Answer questions about Titan Buildings' services, construction process, timelines, and general building information
2. Be helpful and informative while staying focused on topics related to construction and Titan Buildings
3. For complex technical questions, legal matters, or specific pricing, direct customers to contact the team directly
4. If asked about competitors or other companies, politely redirect to Titan Buildings' services
5. Keep responses concise but informative
6. Always be professional and friendly

Current customer context:
- Project ID: ${projectId}
- Customer: ${customerName || 'Valued Customer'}

If you cannot answer a question or it's outside your scope, direct them to contact Titan Buildings directly.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      // Add recent conversation history for context
      ...conversationHistory.slice(-4).map((msg: any) => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.choices[0].message.content;

    console.log('OpenAI response received:', botResponse);

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in titan-ai-support function:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: message,
        response: "I'm sorry, I'm experiencing technical difficulties. Please contact our team directly at (302) 309-9475 or info@buildatitan.com for immediate assistance."
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});