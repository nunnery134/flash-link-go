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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
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

    // If it's HTML, modify relative URLs to absolute URLs and inject navigation script
    if (contentType.includes('text/html')) {
      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
      // Add base tag for relative URLs
      const baseTag = `<base href="${baseUrl}/">`;
      
      // Script to intercept link clicks and send navigation messages to parent
      const navigationScript = `
        <script>
          (function() {
            document.addEventListener('click', function(e) {
              const link = e.target.closest('a');
              if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
                e.preventDefault();
                e.stopPropagation();
                window.parent.postMessage({ type: 'PROXY_NAVIGATE', url: link.href }, '*');
              }
            }, true);
            
            // Intercept form submissions
            document.addEventListener('submit', function(e) {
              const form = e.target;
              if (form.tagName === 'FORM') {
                e.preventDefault();
                const formData = new FormData(form);
                let action = form.action || window.location.href;
                if (form.method.toLowerCase() === 'get') {
                  const params = new URLSearchParams(formData).toString();
                  const url = action + (action.includes('?') ? '&' : '?') + params;
                  window.parent.postMessage({ type: 'PROXY_NAVIGATE', url: url }, '*');
                }
              }
            }, true);
          })();
        </script>
      `;
      
      // Convert relative URLs to absolute
      content = content
        .replace(/href=["'](?!http|\/\/|#|javascript:|mailto:|data:)\/([^"']+)["']/gi, `href="${baseUrl}/$1"`)
        .replace(/href=["'](?!http|\/\/|#|javascript:|mailto:|data:)([^"'\/][^"']+)["']/gi, `href="${baseUrl}/$1"`)
        .replace(/src=["'](?!http|\/\/|data:)\/([^"']+)["']/gi, `src="${baseUrl}/$1"`)
        .replace(/src=["'](?!http|\/\/|data:)([^"'\/][^"']+)["']/gi, `src="${baseUrl}/$1"`)
        .replace(/url\(["']?(?!http|\/\/|data:)\/([^"')]+)["']?\)/gi, `url(${baseUrl}/$1)`)
        .replace(/url\(["']?(?!http|\/\/|data:)([^"'\/][^"')]+)["']?\)/gi, `url(${baseUrl}/$1)`);
      
      // Inject base tag and navigation script
      if (content.includes('<head>')) {
        content = content.replace('<head>', `<head>${baseTag}${navigationScript}`);
      } else if (content.includes('<html>')) {
        content = content.replace('<html>', `<html><head>${baseTag}${navigationScript}</head>`);
      } else {
        content = `${baseTag}${navigationScript}${content}`;
      }
    }

    console.log('Successfully fetched URL:', url);

    // Return as JSON so the frontend can parse it correctly
    return new Response(JSON.stringify(content), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
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