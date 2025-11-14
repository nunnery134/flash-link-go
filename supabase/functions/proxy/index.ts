// File: functions/proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { url } = await req.json();

    if (!url) return new Response("No URL provided", { status: 400 });

    // Fetch the target page
    const res = await fetch(url);
    let html = await res.text();

    // Rewrite relative links to absolute (so links in iframe work)
    html = html.replace(
      /href="(?!https?:\/\/)([^"]*)"/g,
      `href="${new URL("$1", url).href}"`
    );
    html = html.replace(
      /src="(?!https?:\/\/)([^"]*)"/g,
      `src="${new URL("$1", url).href}"`
    );

    // Optional: allow proxying through VPN headers if needed
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    return new Response(`Error: ${err}`, { status: 500 });
  }
});
