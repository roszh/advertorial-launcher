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

    const systemPrompt = `You are structuring content for a presell/advertorial page.

Your job:
1. Preserve every word from the original text
2. Organize content into 5-7 logical sections
3. Extract headlines to the "heading" field (leave empty if no clear headline)
4. Group related paragraphs together in sections
5. Ignore any text in square brackets like [ПРЕДЛОЖЕНИЕ ЗА ИЗОБРАЖЕНИЕ...]

Return JSON in this format:
{
  "layout": "story",
  "sections": [
    {
      "type": "hero" | "text" | "benefits" | "testimonial" | "cta",
      "heading": "optional headline",
      "content": "paragraph(s) of content",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": { "primary": "Learn More" }
}

Use your judgment to decide what's a headline, what's body text, and how to group content logically.`;

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
      
      // POST-PROCESSING VALIDATION: Fix common AI mistakes
      if (result.sections) {
        // 1. Remove image placeholder sections
        result.sections = result.sections.filter((section: any) => {
          const content = section.content || "";
          const heading = section.heading || "";
          return !content.startsWith('[ПРЕДЛОЖЕНИЕ') && 
                 !content.includes('[ПРЕДЛОЖЕНИЕ ЗА ИЗОБРАЖЕНИЕ') &&
                 !heading.startsWith('[ПРЕДЛОЖЕНИЕ');
        });

        // 2. Detect missing headlines in section content and promote them
        result.sections = result.sections.map((section: any) => {
          if (!section.heading && section.content) {
            const lines = section.content.split('\n').filter((l: string) => l.trim());
            if (lines.length > 0) {
              const firstLine = lines[0].trim();
              
              // Check if first line matches headline patterns
              const isHeadline = (
                firstLine === firstLine.toUpperCase() && firstLine.length > 5 && firstLine.length < 100 ||
                firstLine.endsWith(':') ||
                (firstLine.length < 50 && lines.length > 1 && lines[1].length > firstLine.length * 1.5)
              );
              
              if (isHeadline) {
                // Extract headline and remove from content
                const remainingContent = lines.slice(1).join('\n\n');
                return {
                  ...section,
                  heading: firstLine.replace(/:$/, ''),
                  content: remainingContent
                };
              }
            }
          }
          return section;
        });

        // 3. Merge over-segmented sections (if >15 sections, AI failed to group properly)
        if (result.sections.length > 15) {
          console.log(`Over-segmentation detected: ${result.sections.length} sections. Merging...`);
          
          const merged: any[] = [];
          let currentGroup: any = null;
          
          for (const section of result.sections) {
            // Always keep hero section separate
            if (section.type === 'hero') {
              if (currentGroup) merged.push(currentGroup);
              merged.push(section);
              currentGroup = null;
              continue;
            }
            
            // If section has a heading, start a new group
            if (section.heading) {
              if (currentGroup) merged.push(currentGroup);
              currentGroup = { ...section };
            } else {
              // No heading - merge into current group
              if (!currentGroup) {
                currentGroup = { ...section };
              } else {
                currentGroup.content += '\n\n' + section.content;
              }
            }
          }
          
          if (currentGroup) merged.push(currentGroup);
          
          result.sections = merged;
          console.log(`Merged into ${result.sections.length} sections`);
        }
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
