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

  // Keep a copy of input text available for any fallback paths
  let inputText = "";

  try {
    let preserveHtml = false;
    try {
      const body = await req.json();
      inputText = body?.text || "";
      preserveHtml = body?.preserveHtml || false;
    } catch (_) {
      inputText = "";
    }
    const text = inputText;
    
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

    const systemPrompt = `You are a content structuring assistant. Your job is to take ${preserveHtml ? 'HTML-formatted' : 'raw'} text and organize it naturally into sections for a presell/advertorial page.

ONLY ${preserveHtml ? '3' : '2'} RULES:
1. Preserve all original text - don't rewrite or omit anything
2. Use your judgment to structure content naturally - create as many or as few sections as make sense${preserveHtml ? '\n3. PRESERVE ALL HTML TAGS - Keep <h1>, <h2>, <h3>, <strong>, <b>, <em>, <i>, <p>, <br>, <ul>, <ol>, <li>, and other HTML formatting intact' : ''}

SECTION TYPES:
- "hero" - Opening hook/main value proposition
- "text" - General paragraphs and narrative
- "benefits" - Lists of features/advantages
- "testimonial" - Quotes or reviews
- "cta" - Call-to-action or offers

STRUCTURE DECISION:
- If a line naturally feels like a headline (short, introductory, topic-setting), use it as "heading"
- If text flows as body copy (explanatory, detailed, story-like), keep it as "content"
- If you see a list (bullet points, numbered items), format as "benefits" type
- When text is continuous without breaks, group by topic changes into logical paragraphs
- Create section breaks where the topic or tone naturally shifts
- Ignore any text in square brackets like [ПРЕДЛОЖЕНИЕ ЗА ИЗОБРАЖЕНИЕ...]${preserveHtml ? '\n- DO NOT strip or convert HTML tags - keep them exactly as they are in the input' : ''}

EXAMPLES:

Example 1 - Short Marketing Text:
Input: "TRANSFORM YOUR LIFE TODAY\n\nDiscover the secret method that changed everything for thousands. Our proven system delivers results in just 30 days.\n\n- Easy to follow\n- No prior experience needed\n- Money-back guarantee\n\nDon't wait - start your journey now!"

Output:
{
  "layout": "story",
  "sections": [
    {
      "type": "hero",
      "heading": "Transform Your Life Today",
      "content": "Discover the secret method that changed everything for thousands. Our proven system delivers results in just 30 days.",
      "imagePosition": "none",
      "style": "normal"
    },
    {
      "type": "benefits",
      "content": "- Easy to follow\n- No prior experience needed\n- Money-back guarantee",
      "imagePosition": "none",
      "style": "callout"
    },
    {
      "type": "cta",
      "content": "Don't wait - start your journey now!",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": { "primary": "Learn More" }
}

Example 2 - Continuous Text:
Input: "Many people struggle with productivity. They feel overwhelmed and can't focus. This leads to stress and missed opportunities. However, there's a better way. Our method helps you prioritize what matters. You'll accomplish more in less time. The results are remarkable."

Output:
{
  "layout": "story",
  "sections": [
    {
      "type": "text",
      "heading": "The Problem",
      "content": "Many people struggle with productivity. They feel overwhelmed and can't focus. This leads to stress and missed opportunities.",
      "imagePosition": "none",
      "style": "normal"
    },
    {
      "type": "text",
      "heading": "The Solution",
      "content": "However, there's a better way. Our method helps you prioritize what matters. You'll accomplish more in less time. The results are remarkable.",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": { "primary": "Learn More" }
}

RETURN FORMAT:
{
  "layout": "story",
  "sections": [
    {
      "type": "hero" | "text" | "benefits" | "testimonial" | "cta",
      "heading": "optional short headline (or omit if none)",
      "content": "the actual content - this is where most text goes",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": { "primary": "Learn More" }
}

Let the content guide how many sections you create. Trust your judgment.`;

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
        response_format: { type: "json_object" },
        max_completion_tokens: 16000
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
      // Fallback when AI gateway fails: still return full text as a single section
      const fallback = {
        layout: "story",
        sections: [
          { type: "text", content: inputText, heading: undefined, imagePosition: "none", style: "normal", imageUrl: "" }
        ],
        cta: { primary: "Learn More" }
      } as const;
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response received. Length:", JSON.stringify(data).length, "Preview:", JSON.stringify(data).substring(0, 200));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid AI response structure:", JSON.stringify(data));
      // Fallback to full input text structured into paragraphs (no image placeholders)
      const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      const rebuilt = paragraphs.map(p => ({
        type: "text",
        content: p,
        heading: undefined,
        imagePosition: "none",
        style: "normal",
        imageUrl: ""
      }));
      // No image placeholders - user will add manually
      const fallback = { layout: "story", sections: rebuilt, cta: { primary: "Learn More" } } as const;
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result;
    try {
      const content = data.choices[0].message.content;
      
      // Extract JSON from the response (in case there's text before/after)
      let jsonText = content;
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = content.substring(jsonStart, jsonEnd + 1);
      }
      
      result = JSON.parse(jsonText);
      
      // Minimal cleanup: remove image sections and ensure proper types
      if (result.sections) {
        result.sections = result.sections
          .filter((section: any) => {
            // Remove image-only sections
            if (section.type === "image") return false;
            
            // Remove sections with placeholder text
            const content = section.content || "";
            const heading = section.heading || "";
            if (content.startsWith('[ПРЕДЛОЖЕНИЕ') || 
                content.includes('[ПРЕДЛОЖЕНИЕ ЗА ИЗОБРАЖЕНИЕ') ||
                heading.startsWith('[ПРЕДЛОЖЕНИЕ')) {
              return false;
            }
            
            return true;
          })
          .map((section: any) => ({
            ...section,
            content: section.content || "",
            heading: section.heading || undefined,
            imageUrl: section.imageUrl === null ? "" : section.imageUrl,
            ctaText: section.ctaText || undefined
          }));
      }
      
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", data.choices[0].message.content);
      // Fallback: return full text in a single section so user always gets content
      const fallback = {
        layout: "story",
        sections: [
          {
            type: "text",
            content: inputText,
            heading: undefined,
            imagePosition: "none",
            style: "normal",
            imageUrl: ""
          }
        ],
        cta: { primary: "Learn More" }
      } as const;
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-text function:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Robust fallback: always deliver full text as a single section
    const fallback = {
      layout: "story",
      sections: [
        {
          type: "text",
          content: inputText,
          heading: undefined,
          imagePosition: "none",
          style: "normal",
          imageUrl: ""
        }
      ],
      cta: { primary: "Learn More" }
    } as const;
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
