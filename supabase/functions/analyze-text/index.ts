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

    const systemPrompt = `You are a content structure and formatting specialist. Analyze the provided text and structure it for a presell/advertorial page while preserving ALL original formatting.

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:
1. PRESERVE EVERY SINGLE WORD from the original text - do NOT summarize, condense, or shorten anything
2. INCLUDE ALL CONTENT - if the user provides 2000 words, your output must contain all 2000 words
3. DO NOT rewrite, rephrase, or change any of the user's original wording
4. Your job is to organize AND FORMAT the content properly for web display

FORMATTING DETECTION & PRESERVATION:
1. **Headlines**: Identify the main headline (usually the first line or largest text) and place it in the hero section's "heading" field
2. **Subheadlines**: Identify supporting headlines or subtitles and place them in the hero section's "content" field OR as section headings
3. **Bullet Points & Lists**: When you detect bullet points, numbered lists, or ingredient lists:
   - Preserve each item on its own line
   - Use "• " prefix for bullet points
   - Use "1. ", "2. ", etc. for numbered lists
   - Add double line breaks (\n\n) between each item for proper spacing
4. **Paragraphs**: Separate paragraphs with double line breaks (\n\n)
5. **Emphasis**: When text appears to be emphasized (all caps, repeated punctuation), preserve it exactly as written

SECTION STRUCTURE RULES:
1. Hero section MUST contain:
   - "heading": The main article headline (first major heading in the text)
   - "content": The subheadline or first engaging paragraph
2. Body sections should:
   - Group related content together (aim for 3-7 main sections, not dozens)
   - Each section gets a descriptive "heading" that reflects the topic
   - "content" contains all paragraphs, lists, and text for that section
3. Special sections:
   - Use "benefits" type when you detect a list of benefits/features
   - Use "testimonial" type when you detect quotes or testimonials
   - Use "cta" type only if there's an explicit call-to-action button in the text
4. DO NOT add image sections - user will add them manually

FORMATTING OUTPUT RULES:
- For bullet points, format as: "• First benefit point\n\n• Second benefit point\n\n• Third benefit point"
- For numbered lists, format as: "1. First step\n\n2. Second step\n\n3. Third step"
- For paragraphs, separate with: "\n\n"
- For emphasized text, preserve caps and punctuation exactly
- Preserve any special characters, quotes, or symbols from the original

EXAMPLE INPUT:
"BREAKTHROUGH DISCOVERY

Scientists Reveal Secret to Youthful Skin

A groundbreaking study shows remarkable results.

Key Benefits:
- Reduces wrinkles by 40%
- Improves skin elasticity
- Natural ingredients

The research included three phases:
1. Laboratory testing
2. Clinical trials  
3. Long-term studies"

EXAMPLE OUTPUT:
{
  "layout": "story",
  "sections": [
    {
      "type": "hero",
      "heading": "BREAKTHROUGH DISCOVERY",
      "content": "Scientists Reveal Secret to Youthful Skin",
      "imagePosition": "full",
      "style": "emphasized"
    },
    {
      "type": "text",
      "heading": "Revolutionary Research",
      "content": "A groundbreaking study shows remarkable results.",
      "imagePosition": "none",
      "style": "normal"
    },
    {
      "type": "benefits",
      "heading": "Key Benefits",
      "content": "• Reduces wrinkles by 40%\n\n• Improves skin elasticity\n\n• Natural ingredients",
      "imagePosition": "none",
      "style": "callout"
    },
    {
      "type": "text",
      "heading": "Research Phases",
      "content": "The research included three phases:\n\n1. Laboratory testing\n\n2. Clinical trials\n\n3. Long-term studies",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": {
    "primary": "Learn More"
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
        console.log("AI output detected as truncated; rebuilding with structure from input text.");
        
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const rebuilt: any[] = [];
        let currentSection: any = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const nextLine = lines[i + 1];
          
          // Detect headlines: all caps, short (<80 chars), or ends with ":"
          const isHeadline = (
            line === line.toUpperCase() && line.length < 80 ||
            line.endsWith(':') ||
            (line.length < 50 && nextLine && nextLine.length > line.length * 1.5)
          );
          
          if (isHeadline) {
            // Save previous section
            if (currentSection && currentSection.content.trim()) {
              rebuilt.push(currentSection);
            }
            // Start new section
            currentSection = {
              type: "text",
              heading: line.replace(/:$/, ''),
              content: "",
              imagePosition: "none",
              style: "normal",
              imageUrl: ""
            };
          } else if (line.match(/^[•\-\*]\s/) || line.match(/^\d+\.\s/)) {
            // Bullet point or numbered list
            if (!currentSection) {
              currentSection = {
                type: "benefits",
                heading: undefined,
                content: "",
                imagePosition: "none",
                style: "callout",
                imageUrl: ""
              };
            }
            currentSection.content += (currentSection.content ? '\n\n' : '') + line;
          } else {
            // Regular paragraph
            if (!currentSection) {
              currentSection = {
                type: "text",
                heading: undefined,
                content: "",
                imagePosition: "none",
                style: "normal",
                imageUrl: ""
              };
            }
            currentSection.content += (currentSection.content ? '\n\n' : '') + line;
          }
        }
        
        // Add final section
        if (currentSection && currentSection.content.trim()) {
          rebuilt.push(currentSection);
        }
        
        result = { 
          layout: "story", 
          sections: rebuilt.length > 0 ? rebuilt : [{ type: "text", content: text, heading: undefined, imagePosition: "none", style: "normal", imageUrl: "" }],
          cta: result.cta || { primary: "Learn More" } 
        };
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
