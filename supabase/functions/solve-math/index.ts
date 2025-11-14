 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Accept either `image` (used by the frontend) or `imageBase64` (older name)
    let imageInput = body.image ?? body.imageBase64 ?? null;

    if (!imageInput) {
      return new Response(JSON.stringify({ error: "No screenshot provided." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a raw base64 string supplied (not a data URL), turn it into a data URL
    if (!String(imageInput).startsWith("data:")) {
      imageInput = `data:image/png;base64,${imageInput}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Solving math problem from screenshot...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a math expert. Analyze the screenshot and solve all math problems. Show every step clearly.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Solve this math problem from the screenshot. Show your work." },
              { type: "image_url", image_url: { url: imageInput } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Failed to solve math problem: ${response.status}`);
    }

    const data = await response.json();

    // Try to extract text content robustly (API may nest message content differently)
    let solution: string | null = null;
    try {
      // common shape: data.choices[0].message.content (string or array)
      const choice = data.choices?.[0];
      const message = choice?.message ?? choice ?? null;

      if (message) {
        // if message.content is a string
        if (typeof message.content === "string") {
          solution = message.content;
        } else if (Array.isArray(message.content)) {
          // if message.content is array of parts, join text parts
          solution = message.content
            .map((part: any) => {
              if (typeof part === "string") return part;
              if (part?.text) return part.text;
              if (part?.type === "output_text" && part?.text) return part.text;
              return "";
            })
            .join("");
        } else if (typeof message.content === "object" && message.content?.text) {
          solution = message.content.text;
        }
      }
    } catch (e) {
      console.warn("Failed to parse solution payload shape, falling back to raw data", e);
    }

    // fallback: stringify body if we couldn't parse a clear solution
    if (!solution) {
      solution = JSON.stringify(data);
    }

    console.log("Math problem solved successfully");

    return new Response(JSON.stringify({ solution }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in solve-math function:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
