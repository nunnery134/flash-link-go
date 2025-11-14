import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching URL:', url);

    // Fetch the target URL through the proxy
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: `Failed to fetch: ${response.statusText}` }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'text/html';
    
    // Get the response body
    let content = await response.text();

    // If it's HTML, modify relative URLs to absolute URLs
    if (contentType.includes('text/html')) {
      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      // Convert relative URLs to absolute
      content = content
        .replace(/href=["'](?!http|\/\/|#|javascript:|mailto:)([^"']+)["']/gi, `href="${baseUrl}/$1"`)
        .replace(/src=["'](?!http|\/\/|data:)([^"']+)["']/gi, `src="${baseUrl}/$1"`)
        .replace(/url\(["']?(?!http|\/\/|data:)([^"')]+)["']?\)/gi, `url(${baseUrl}/$1)`);
    }

    console.log('Successfully fetched URL:', url);

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in proxy function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
