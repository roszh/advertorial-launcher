import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sections, model = "google/gemini-2.5-flash" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional proofreader and editor. Analyze the given page sections and provide specific, actionable suggestions for improvements.

CRITICAL RULES:
1. Review text fields: content, heading, ctaText, author, authorRole, verifiedText, items[], buttonText
2. Focus on: grammar, spelling, punctuation, clarity, readability, and persuasiveness
3. PRESERVE all HTML tags in the suggested text
4. Return suggestions in this EXACT JSON format:
{
  "suggestions": [
    {
      "sectionIndex": 0,
      "field": "content",
      "original": "exact original text",
      "suggested": "improved text with HTML preserved",
      "reason": "Brief explanation of the change"
    }
  ]
}
5. Only suggest changes that meaningfully improve the text
6. If no improvements needed, return empty array: {"suggestions": []}

Return ONLY valid JSON, no explanations outside the JSON structure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(sections) }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits to your Lovable workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let suggestionsText = data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = suggestionsText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      suggestionsText = jsonMatch[1];
    }
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(suggestionsText.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", suggestionsText);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in proofread-suggestions function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
