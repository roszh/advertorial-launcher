import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert copywriter and conversion optimization specialist. Analyze the provided text and structure it for maximum conversion on a presell/advertorial page.

Your task:
1. Identify the main sections (headline, subheadline, problem, solution, benefits, social proof, CTA)
2. Choose the best layout type based on content (story, list, problem-solution, how-to)
3. Suggest optimal image placements throughout the article (3-5 images recommended)
4. Rewrite and format text for high conversion
5. Create compelling headlines and CTAs

CRITICAL FORMATTING RULES:
- Return ONLY plain text content. DO NOT include any HTML tags, markdown formatting, or special characters.
- Use only plain text with line breaks (\n) for paragraphs.
- For sections that should have images, set imageUrl to "" (empty string) as a placeholder

IMPORTANT: Include 3-5 sections with empty imageUrl strings ("") throughout the article to indicate where images should be placed. These will be click-to-upload placeholders for the user.

Return a JSON object with this structure:
{
  "layout": "story" | "list" | "problem-solution" | "how-to",
  "sections": [
    {
      "type": "hero" | "text" | "image" | "cta" | "benefits" | "testimonial",
      "content": "plain text content without any HTML tags",
      "heading": "plain text heading without any HTML tags",
      "imagePosition": "left" | "right" | "full" | "none",
      "style": "normal" | "emphasized" | "callout",
      "imageUrl": "" // empty string for placeholder images
    }
  ],
  "cta": {
    "primary": "main CTA text",
    "secondary": "optional secondary CTA"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze and optimize this text for a presell page:\n\n${text}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-text function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
