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
    try {
      const body = await req.json();
      inputText = body?.text || "";
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

    const systemPrompt = `You are a content structure specialist. Analyze the provided text and structure it for a presell/advertorial page.

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:
1. PRESERVE EVERY SINGLE WORD from the original text - do NOT summarize, condense, or shorten anything
2. INCLUDE ALL CONTENT - if the user provides 2000 words, your output must contain all 2000 words
3. DO NOT rewrite, rephrase, or change any of the user's original wording
4. Your ONLY job is to organize the existing content into meaningful sections with clear headings
5. If any content seems long, that's fine - include ALL of it in the appropriate section

SECTION STRUCTURE RULES:
1. Create a hero section with the main headline as "heading" and subheadline as "content"
2. Group related paragraphs together under meaningful section headings
3. Each body section MUST have a descriptive "heading" that summarizes what that section is about
4. Aim for 3-7 main body sections (not dozens of tiny sections)
5. Each section can contain multiple paragraphs in the "content" field
6. DO NOT create a separate section for every single paragraph - group related content together
7. DO NOT add any image placeholder sections - the user will add images manually
8. Add CTA buttons only if they are NOT already present in the text

CRITICAL FORMATTING RULES:
- Return ONLY plain text content. DO NOT include any HTML tags, markdown formatting, or special characters.
- Use line breaks (\n\n) to separate paragraphs within a section's content.
- IMPORTANT: When the original text contains lists, bullet points, or ingredients, you MUST add TWO line breaks (\n\n) between each item.
- Preserve the exact wording, tone, and style - EVERY SINGLE WORD
- NEVER truncate or summarize - include the COMPLETE original text
- DO NOT include any image sections with type "image" - only text, hero, cta, benefits, or testimonial sections

EXAMPLE OUTPUT STRUCTURE:
{
  "layout": "story",
  "sections": [
    {
      "type": "hero",
      "heading": "Main Article Headline",
      "content": "Subheadline or intro paragraph",
      "imagePosition": "full",
      "style": "emphasized"
    },
    {
      "type": "text",
      "heading": "First Major Topic",
      "content": "Multiple paragraphs of content grouped together...\n\nSecond paragraph continues the topic...\n\nThird paragraph wraps it up...",
      "imagePosition": "none",
      "style": "normal"
    },
    {
      "type": "text",
      "heading": "Second Major Topic",
      "content": "Content for this section...",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": {
    "primary": "main CTA text"
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
    console.log("AI response received:", JSON.stringify(data).substring(0, 200));
    
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
      
      // Clean up null values and ensure proper types, and filter out any image sections
      if (result.sections) {
        result.sections = result.sections
          .filter((section: any) => section.type !== "image") // Remove all image sections
          .map((section: any) => ({
            ...section,
            content: section.content || "",
            heading: section.heading || undefined,
            imageUrl: section.imageUrl === null ? "" : section.imageUrl,
            ctaText: section.ctaText || undefined
          }));
      }
      
      // If AI output seems truncated, rebuild from full input to ensure complete delivery
      const inputLen = text.length;
      const outputLen = (result.sections || []).reduce((acc: number, s: any) => acc + String(s.content || "").length, 0);
      if (outputLen < Math.max(inputLen * 0.9, inputLen - 200)) {
        const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
        const rebuilt = paragraphs.map(p => ({
          type: "text",
          content: p,
          heading: undefined,
          imagePosition: "none",
          style: "normal",
          imageUrl: ""
        }));
        // No image placeholders added - user will add them manually
        result = { layout: "story", sections: rebuilt, cta: result.cta || { primary: "Learn More" } };
        console.log("AI output detected as truncated; rebuilt from input text.");
      }
      
      console.log("Successfully parsed AI response");
      
      // Ensure a proper hero section with heading/subheadline exists
      const hasHero = (result.sections || []).some((s: any) => s.type === "hero" && (s.heading || s.content));
      if (!hasHero) {
        const combined = text;
        const parts = combined.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
        const heading = parts.shift() || "";
        const sub = parts.length ? parts.shift() : "";
        const hero = { type: "hero", heading, content: sub || "", imagePosition: "full", style: "emphasized", imageUrl: "" };
        const remaining = parts.map(p => ({ type: "text", content: p, imagePosition: "none", style: "normal" }));
        result.sections = [hero, ...remaining];
      }
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
