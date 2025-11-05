import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export const ProxyBrowser = () => {
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [displayUrl, setDisplayUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [proxyContent, setProxyContent] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const validateAndFormatUrl = (input: string): string => {
    let formattedUrl = input.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    return formattedUrl;
  };

  const loadUrl = async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);
    const formattedUrl = validateAndFormatUrl(targetUrl);
    
    try {
      new URL(formattedUrl);
      
      console.log('Loading URL through proxy:', formattedUrl);
      
      // Call the proxy edge function
      const { data, error: proxyError } = await supabase.functions.invoke('proxy', {
        body: { url: formattedUrl }
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }

      // Update state
      setCurrentUrl(formattedUrl);
      setDisplayUrl(formattedUrl);
      setProxyContent(data);
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(formattedUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      toast({
        title: "Success!",
        description: "Website loaded through proxy",
      });
      
      setIsLoading(false);
    } catch (e) {
      console.error('Error loading URL:', e);
      setError("Failed to load website. The site may be down or blocking proxy access.");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      loadUrl(url);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      loadUrl(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      loadUrl(history[newIndex]);
    }
  };

  const handleRefresh = () => {
    if (currentUrl) {
      loadUrl(currentUrl);
    }
  };

  const handleHome = () => {
    setUrl("");
    setCurrentUrl("");
    setDisplayUrl("");
    setProxyContent("");
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Browser Chrome */}
      <div className="glass-morphism border-b">
        <div className="flex items-center gap-2 p-3">
          {/* Navigation Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className="transition-smooth hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              className="transition-smooth hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={!currentUrl}
              className="transition-smooth hover:bg-secondary"
            >
              <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHome}
              className="transition-smooth hover:bg-secondary"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* Address Bar */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter a website URL..."
                className="pl-10 bg-input border-border focus-visible:ring-primary transition-smooth"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!url || isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth min-w-[80px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading
                </>
              ) : (
                "Go"
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="m-4 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin glow-effect" />
              <p className="text-lg font-medium">Loading website...</p>
              <p className="text-sm text-muted-foreground">Fetching through secure proxy</p>
            </div>
          </div>
        )}
        
        {!currentUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md px-4">
              <Shield className="h-20 w-20 text-primary mx-auto glow-effect" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Lightning Proxy
              </h1>
              <p className="text-muted-foreground text-lg">
                Enter any URL above to browse securely and bypass restrictions
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUrl("crazygames.com");
                    loadUrl("crazygames.com");
                  }}
                  className="transition-smooth"
                >
                  Try CrazyGames
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUrl("example.com");
                    loadUrl("example.com");
                  }}
                  className="transition-smooth"
                >
                  Try Example
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            srcDoc={proxyContent}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            title="Proxy Browser"
          />
        )}
      </div>
    </div>
  );
};
