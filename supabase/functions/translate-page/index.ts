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
    const { sections, targetLanguage, model = "google/gemini-2.5-flash" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageNames: Record<string, string> = {
      fr: "French",
      it: "Italian",
      nl: "Dutch",
      de: "German",
      ro: "Romanian",
      cs: "Czech",
      pl: "Polish",
      hu: "Hungarian"
    };

    const systemPrompt = `You are a professional translator. Translate the given page sections to ${languageNames[targetLanguage] || targetLanguage}.

CRITICAL RULES:
1. Translate ONLY these text fields: content, heading, ctaText, author, authorRole, verifiedText, items[], buttonText
2. PRESERVE all HTML tags and structure exactly as they are
3. KEEP all non-text fields unchanged: imageUrl, type, style, imagePosition, id, order, etc.
4. Return ONLY valid JSON array of sections, no explanations
5. Maintain the original tone and style

Return the translated sections as a JSON array.`;

    // Translate sections in batches to avoid timeout
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(sections.length / BATCH_SIZE);
    const translatedSections: any[] = [];
    
    // Create a readable stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < sections.length; i += BATCH_SIZE) {
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;
          const batch = sections.slice(i, i + BATCH_SIZE);
          
          // Send progress update
          const progress = {
            type: 'progress',
            currentBatch: batchNum,
            totalBatches,
            sectionsTranslated: translatedSections.length,
            totalSections: sections.length
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
          
          console.log(`Translating batch ${batchNum} of ${totalBatches}`);
          
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
                { role: "user", content: JSON.stringify(batch) }
              ],
            }),
          });

          if (!response.ok) {
            if (response.status === 429) {
              const error = { type: 'error', error: "Rate limits exceeded, please try again later." };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(error)}\n\n`));
              controller.close();
              return;
            }
            if (response.status === 402) {
              const error = { type: 'error', error: "Payment required, please add credits to your Lovable workspace." };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(error)}\n\n`));
              controller.close();
              return;
            }
            const errorText = await response.text();
            console.error("AI gateway error:", response.status, errorText);
            const error = { type: 'error', error: "AI gateway error" };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(error)}\n\n`));
            controller.close();
            return;
          }

          const data = await response.json();
          let translatedText = data.choices[0].message.content;
          
          // Extract JSON from markdown code blocks if present
          const jsonMatch = translatedText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
          if (jsonMatch) {
            translatedText = jsonMatch[1];
          }
          
          // Parse the JSON response
          let batchTranslated;
          try {
            batchTranslated = JSON.parse(translatedText.trim());
          } catch (e) {
            console.error("Failed to parse AI response for batch:", translatedText);
            // If parsing fails, use original sections for this batch
            batchTranslated = batch;
          }
          
          // Ensure we got an array
          if (Array.isArray(batchTranslated)) {
            translatedSections.push(...batchTranslated);
          } else {
            // If single object returned, wrap in array
            translatedSections.push(batchTranslated);
          }
        }

        console.log(`Successfully translated ${translatedSections.length} sections`);
        
        // Send final result
        const result = { type: 'complete', sections: translatedSections };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (error) {
    console.error("Error in translate-page function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
