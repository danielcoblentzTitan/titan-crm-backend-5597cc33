import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, customerName, conversationHistory } = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Initialize Supabase client for FAQ lookup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Search FAQ database for relevant answers
    const { data: faqMatches } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .or(`question.ilike.%${message}%,bot_short_answer.ilike.%${message}%,bot_long_answer.ilike.%${message}%`)
      .limit(3);

    // Also search by keywords
    const { data: keywordMatches } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .contains('keywords', [message.toLowerCase()])
      .limit(2);

    const allMatches = [...(faqMatches || []), ...(keywordMatches || [])];
    const uniqueMatches = allMatches.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    let faqContext = '';
    let suggestedQuestions = [];
    
    if (uniqueMatches.length > 0) {
      faqContext = `\n\nRELEVANT FAQ ENTRIES:\n` + 
        uniqueMatches.map(faq => 
          `Q: ${faq.question}\nShort Answer: ${faq.bot_short_answer}\n` +
          (faq.bot_long_answer ? `Detailed Answer: ${faq.bot_long_answer}\n` : '') +
          (faq.escalation_hint ? `Escalation Note: ${faq.escalation_hint}\n` : '')
        ).join('\n---\n');

      // Get related questions for suggestions
      for (const match of uniqueMatches.slice(0, 2)) {
        if (match.related_ids && match.related_ids.length > 0) {
          const { data: related } = await supabase
            .from('faq_items')
            .select('question')
            .in('id', match.related_ids)
            .eq('is_active', true)
            .limit(2);
          
          if (related) {
            suggestedQuestions.push(...related.map(r => r.question));
          }
        }
      }
    }

    const systemPrompt = `You are an AI assistant for Titan Buildings, a construction company specializing in steel buildings, pole barns, and barndominiums. You help customers with questions about their building projects.

    Key information about Titan Buildings:
    - We build steel buildings, pole buildings, and barndominiums
    - We serve primarily Delaware and Maryland
    - We handle permits, inspections, and the complete construction process
    - Our projects typically take 4-8 weeks from start to finish
    - We provide 3D design services and work with customers on customization

    IMPORTANT FAQ INTEGRATION GUIDELINES:
    1. If FAQ entries are provided below, prioritize using that information in your response
    2. For construction-phase questions, check if there's a relevant FAQ entry first
    3. Use the "Short Answer" for immediate response, then offer to provide more details
    4. If there's an escalation hint, consider when the customer might need to speak with their PM
    5. After answering from FAQ, you can offer related questions if provided

    RESPONSE STYLE:
    - Be helpful, professional, and reassuring
    - For construction questions, explain the "why" behind processes
    - If a question requires project-specific information, suggest contacting their project manager
    - Keep responses concise but informative
    - If you find a good FAQ match, structure your response as:
      * Immediate answer (from bot_short_answer)
      * Offer "Would you like more details?" (to provide bot_long_answer)
      * Suggest related questions if available

    ${faqContext}

    Current conversation context:
    Customer: ${customerName}
    Project ID: ${projectId}
    
    Previous conversation:
    ${conversationHistory?.map((msg: any) => `${msg.isBot ? 'Assistant' : 'Customer'}: ${msg.content}`).join('\n') || 'None'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory?.slice(-5).map((msg: any) => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.content
      })) || [],
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Prepare response with suggestions
    const responseData = {
      message: aiResponse,
      suggestedQuestions: suggestedQuestions.slice(0, 3),
      faqMatched: uniqueMatches.length > 0
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in titan-ai-support-enhanced function:', error);
    return new Response(
      JSON.stringify({ 
        error: "I apologize, but I'm having trouble processing your request right now. Please try again or contact your project manager directly." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});