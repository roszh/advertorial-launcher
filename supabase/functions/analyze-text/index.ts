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

    const systemPrompt = `You are an intelligent content analyzer that structures text for presell/advertorial pages.

CRITICAL RULES:
1. Preserve EVERY word from the original text - never omit or rewrite content
2. Be smart about distinguishing headlines from paragraphs from lists
3. Organize content into 5-7 logical, well-structured sections
4. Ignore text in square brackets like [ПРЕДЛОЖЕНИЕ ЗА ИЗОБРАЖЕНИЕ...]

HEADLINE DETECTION RULES:
- Headlines are typically SHORT (3-12 words, 20-80 characters max)
- Often positioned at the start of a new topic or major idea
- May be questions or statements that introduce what follows
- Usually more GENERAL than the detailed text that follows
- Common patterns:
  * ALL CAPS TEXT
  * Title Case With Each Word Capitalized
  * Lines ending with a colon (:)
  * Isolated short lines followed by longer explanatory text
- Semantically distinct from body text (acts as a "label" or "introduction")
- If a line is 100+ characters, it's probably NOT a headline - keep it in content

PARAGRAPH DETECTION RULES:
- Body text is typically LONGER (50+ characters, often multiple sentences)
- Contains complete, detailed sentences with proper punctuation
- Explains, describes, elaborates, or tells a story
- May span multiple sentences discussing the same topic
- Should remain in the "content" field, NOT extracted as a heading

BULLET POINT / LIST DETECTION RULES:
- Lines starting with: •, -, *, or numbers (1., 2., etc.)
- Short, parallel statements of similar structure
- Lists of features, benefits, steps, or options
- Should be formatted as a list section (type: "benefits")
- Keep list markers (•, -, *) in the content

CONTINUOUS TEXT HANDLING (MOST IMPORTANT):
When you receive unformatted text without clear breaks:
- DO NOT assume everything is a headline
- Look for SEMANTIC TOPIC CHANGES to identify natural paragraph breaks
- Identify sentence clusters that discuss the same concept
- Break into 2-4 logical sections based on:
  * Topic transitions (new subject introduced)
  * Conjunctions/transitions: "However", "Additionally", "Meanwhile", "In fact", "Furthermore"
  * Question-answer patterns
  * Time-based transitions: "First", "Then", "Finally", "Next"
  * Problem-solution shifts
- Group related sentences into paragraphs (3-5 sentences per section typically)
- Only extract TRUE headlines - if text is continuous prose, most of it goes in "content"

SECTION TYPE INTELLIGENCE:
- type: "hero" → Opening section with main value proposition (use for first section with strong hook)
- type: "benefits" → Lists of features, advantages, bullet points
- type: "testimonial" → First-person quotes, reviews, customer stories
- type: "cta" → Call-to-action, urgency statements, special offers, action prompts
- type: "text" → General narrative, explanatory paragraphs, story content

GOOD vs BAD EXAMPLES:

✅ GOOD:
{
  "heading": "Why This Changes Everything",
  "content": "This revolutionary approach has transformed how thousands of people solve their problems. The results speak for themselves with over 95% satisfaction rates. Our unique method combines proven strategies with cutting-edge technology."
}

❌ BAD (treating body text as headline):
{
  "heading": "This revolutionary approach has transformed how thousands of people solve their problems with results that speak for themselves",
  "content": ""
}

✅ GOOD (continuous text properly segmented):
Section 1:
{
  "heading": "The Problem Most People Face",
  "content": "Every day, millions struggle with this common challenge. It affects their productivity, happiness, and success. Traditional solutions have failed to address the root cause."
}
Section 2:
{
  "heading": "A Better Solution Exists",
  "content": "Our innovative approach tackles the problem from a completely different angle. Instead of temporary fixes, we address the underlying issues. This creates lasting, meaningful change."
}

❌ BAD (treating every sentence as a headline):
Multiple sections with:
{"heading": "Every day millions struggle with this common challenge", "content": ""}
{"heading": "It affects their productivity happiness and success", "content": ""}
{"heading": "Traditional solutions have failed to address the root cause", "content": ""}

RETURN FORMAT:
{
  "layout": "story",
  "sections": [
    {
      "type": "hero" | "text" | "benefits" | "testimonial" | "cta",
      "heading": "optional short headline (or undefined if none)",
      "content": "paragraph(s) of content - this is where MOST text should go",
      "imagePosition": "none",
      "style": "normal"
    }
  ],
  "cta": { "primary": "Learn More" }
}

Remember: When in doubt, keep text in "content" rather than forcing it into "heading". Real headlines are rare and distinct.`;

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

        // 2. Validate headline quality and move overly long "headlines" to content
        result.sections = result.sections.map((section: any) => {
          // If heading is too long (>100 chars), it's probably not a headline
          if (section.heading && section.heading.length > 100) {
            const newContent = section.content 
              ? `${section.heading}\n\n${section.content}`
              : section.heading;
            return {
              ...section,
              heading: undefined,
              content: newContent
            };
          }
          
          // If heading exists but is just body text (contains multiple sentences)
          if (section.heading && section.heading.split(/[.!?]+/).length > 2) {
            const newContent = section.content 
              ? `${section.heading}\n\n${section.content}`
              : section.heading;
            return {
              ...section,
              heading: undefined,
              content: newContent
            };
          }
          
          // Promote genuine headlines from content if they exist
          if (!section.heading && section.content) {
            const lines = section.content.split('\n').filter((l: string) => l.trim());
            if (lines.length > 0) {
              const firstLine = lines[0].trim();
              
              // Check if first line matches headline patterns
              const isHeadline = (
                (firstLine === firstLine.toUpperCase() && firstLine.length > 5 && firstLine.length < 80) ||
                firstLine.endsWith(':') ||
                (firstLine.length < 60 && lines.length > 1 && lines[1].length > firstLine.length * 1.5)
              );
              
              if (isHeadline) {
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
        
        // Smart paragraph breaking for continuous text
        const smartBreakContinuousText = (text: string): any[] => {
          // If text has clear line breaks, use those
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          
          if (lines.length > 3) {
            // Text has structure, process line by line
            const rebuilt: any[] = [];
            let currentSection: any = null;
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const nextLine = lines[i + 1];
              
              // Detect headlines: all caps, short (<80 chars), or ends with ":"
              const isHeadline = (
                (line === line.toUpperCase() && line.length < 80 && line.length > 5) ||
                line.endsWith(':') ||
                (line.length < 60 && nextLine && nextLine.length > line.length * 1.5)
              );
              
              if (isHeadline) {
                if (currentSection && currentSection.content.trim()) {
                  rebuilt.push(currentSection);
                }
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
                if (!currentSection || currentSection.type !== "benefits") {
                  if (currentSection && currentSection.content.trim()) {
                    rebuilt.push(currentSection);
                  }
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
            
            if (currentSection && currentSection.content.trim()) {
              rebuilt.push(currentSection);
            }
            
            return rebuilt;
          } else {
            // Continuous text without line breaks - use semantic analysis
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            
            // Look for transition words that signal topic changes
            const transitions = [
              'however', 'additionally', 'meanwhile', 'in fact', 'furthermore',
              'moreover', 'on the other hand', 'in contrast', 'similarly',
              'first', 'second', 'third', 'finally', 'then', 'next',
              'but', 'yet', 'therefore', 'thus', 'consequently'
            ];
            
            const sections: any[] = [];
            let currentGroup: string[] = [];
            
            sentences.forEach((sentence, i) => {
              const trimmed = sentence.trim();
              const startsWithTransition = transitions.some(t => 
                trimmed.toLowerCase().startsWith(t + ' ') || 
                trimmed.toLowerCase().startsWith(t + ',')
              );
              
              // Start new section on transitions (but not the first sentence)
              if (i > 0 && startsWithTransition && currentGroup.length >= 2) {
                if (currentGroup.length > 0) {
                  sections.push({
                    type: "text",
                    content: currentGroup.join(' '),
                    heading: undefined,
                    imagePosition: "none",
                    style: "normal",
                    imageUrl: ""
                  });
                  currentGroup = [];
                }
              }
              
              currentGroup.push(trimmed);
              
              // Also break after every 3-4 sentences to avoid overly long sections
              if (currentGroup.length >= 4) {
                sections.push({
                  type: "text",
                  content: currentGroup.join(' '),
                  heading: undefined,
                  imagePosition: "none",
                  style: "normal",
                  imageUrl: ""
                });
                currentGroup = [];
              }
            });
            
            // Add remaining sentences
            if (currentGroup.length > 0) {
              sections.push({
                type: "text",
                content: currentGroup.join(' '),
                heading: undefined,
                imagePosition: "none",
                style: "normal",
                imageUrl: ""
              });
            }
            
            return sections.length > 0 ? sections : [{
              type: "text",
              content: text,
              heading: undefined,
              imagePosition: "none",
              style: "normal",
              imageUrl: ""
            }];
          }
        };
        
        const rebuilt = smartBreakContinuousText(text);
        
        
        result = { 
          layout: "story", 
          sections: rebuilt.length > 0 ? rebuilt : [{
            type: "text",
            content: text,
            heading: undefined,
            imagePosition: "none",
            style: "normal",
            imageUrl: ""
          }],
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
