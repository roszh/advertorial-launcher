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
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting image optimization for:", imageUrl);

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }

    const imageBlob = await imageResponse.blob();
    
    // Check file size - if already small, skip AI optimization
    const fileSizeKB = imageBlob.size / 1024;
    console.log(`Image size: ${fileSizeKB.toFixed(2)} KB`);
    
    if (fileSizeKB < 300) {
      console.log("Image already optimized, returning original");
      return new Response(
        JSON.stringify({ optimizedUrl: imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageBuffer = await imageBlob.arrayBuffer();

    // Convert to base64 for the AI to process
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const dataUrl = `data:${imageBlob.type};base64,${base64Image}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to optimize and resize the image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Optimize this image for web: resize to max 1200px width maintaining aspect ratio, convert to WebP format, compress to under 300KB while maintaining visual quality, enhance sharpness and colors for professional appearance.",
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        modalities: ["image"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI response error:", errorText);
      // If AI optimization fails, return the original image
      return new Response(
        JSON.stringify({ optimizedUrl: imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const optimizedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!optimizedImageUrl) {
      console.log("No optimized image returned from AI, using original");
      return new Response(
        JSON.stringify({ optimizedUrl: imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Image optimization successful");
    return new Response(
      JSON.stringify({ optimizedUrl: optimizedImageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in optimize-image function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
