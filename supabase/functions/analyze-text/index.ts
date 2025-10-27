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

    const systemPrompt = `You are a content structure specialist. Analyze the provided text and structure it for a presell/advertorial page.

CRITICAL: DO NOT rewrite or change the user's content. Your ONLY job is to:
1. Identify and organize the existing sections (headline, subheadline, body paragraphs, etc.)
2. Choose the best layout type based on content (story, list, problem-solution, how-to)
3. Suggest optimal image placements throughout the article (3-5 images recommended)
4. Add CTA buttons only if they are NOT already present in the text
5. Preserve the exact wording, tone, and style of the original text

CRITICAL FORMATTING RULES:
- Return ONLY plain text content. DO NOT include any HTML tags, markdown formatting, or special characters.
- Use line breaks (\n) to separate paragraphs and list items.
- IMPORTANT: When the original text contains lists, bullet points, or ingredients, you MUST add TWO line breaks (\n\n) between each item to ensure readability.
- IMPORTANT: When the original text has clear paragraph breaks or formatting, preserve them with double line breaks (\n\n).
- For sections that should have images, set imageUrl to "" (empty string) as a placeholder.
- Avoid creating large blocks of text - break them up into digestible paragraphs with proper spacing.

FORMATTING EXAMPLE:
If original text has ingredients like "Ingredient A: description. Ingredient B: description." 
You should format as: "Ingredient A: description.\n\nIngredient B: description."

IMPORTANT: Include 3-5 sections with empty imageUrl strings ("") throughout the article to indicate where images should be placed. These will be click-to-upload placeholders for the user.

Return a JSON object with this structure:
{
  "layout": "story" | "list" | "problem-solution" | "how-to",
  "sections": [
    {
      "type": "hero" | "text" | "image" | "cta" | "benefits" | "testimonial",
      "content": "plain text content without any HTML tags, with proper line breaks (\n\n) between list items and paragraphs",
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
          { role: "user", content: `Structure this text for a presell page (preserve the original wording):\n\n${text}` }
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
    console.log("AI response received:", JSON.stringify(data).substring(0, 200));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid AI response structure:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Invalid response from AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", data.choices[0].message.content);
      return new Response(
        JSON.stringify({ error: "AI returned invalid JSON format. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-text function:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred. Please try again." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
