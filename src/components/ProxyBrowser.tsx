import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, Loader2, Plus, X, Play, Pause, Volume2, Calculator, Star, Maximize, Minimize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { MathSolver } from "./MathSolver";

interface TabState {
  id: string;
  url: string;
  currentUrl: string;
  displayUrl: string;
  isLoading: boolean;
  error: string | null;
  history: string[];
  historyIndex: number;
  proxyContent: string;
  title: string;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export const ProxyBrowser = () => {
  const initialTab: TabState = {
    id: "tab-1",
    url: "https://navis-proxy-v4.vercel.app/search.html",
    currentUrl: "",
    displayUrl: "",
    isLoading: false,
    error: null,
    history: [],
    historyIndex: -1,
    proxyContent: "",
    title: "New Tab"
  };
  
  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [escPressCount, setEscPressCount] = useState<number>(0);
  const escTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const currentTab = tabs.find(t => t.id === activeTab);
  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const validateAndFormatUrl = (input: string): string => {
    let formattedUrl = input.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    return formattedUrl;
  };

  const loadUrlForTab = async (tabId: string, targetUrl: string) => {
    const formattedUrl = validateAndFormatUrl(targetUrl);
    setTabs(prevTabs => prevTabs.map(t => 
      t.id === tabId ? { ...t, isLoading: true, error: null } : t
    ));
    
    try {
      new URL(formattedUrl);
      
      console.log('Loading URL through proxy:', formattedUrl);
      
      const { data, error: proxyError } = await supabase.functions.invoke('proxy', {
        body: { url: formattedUrl }
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }

      setTabs(prevTabs => {
        const tab = prevTabs.find(t => t.id === tabId);
        if (!tab) return prevTabs;

        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(formattedUrl);
        
        const urlObj = new URL(formattedUrl);
        const title = urlObj.hostname || "New Tab";

        return prevTabs.map(t => t.id === tabId ? {
          ...t,
          currentUrl: formattedUrl,
          displayUrl: formattedUrl,
          proxyContent: data,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: false,
          title
        } : t);
      });
      
      toast({
        title: "Success!",
        description: "Website loaded through proxy",
      });
    } catch (e) {
      console.error('Error loading URL:', e);
      setTabs(prevTabs => prevTabs.map(t => 
        t.id === tabId ? { 
          ...t,
          error: "Failed to load website. The site may be down or blocking proxy access.",
          isLoading: false 
        } : t
      ));
    }
  };

  useEffect(() => {
    // Load the default URL on mount
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab && currentTab.url) {
      loadUrlForTab(activeTab, currentTab.url);
    }
  };

  const handleBack = () => {
    if (!currentTab) return;
    if (currentTab.historyIndex > 0) {
      const newIndex = currentTab.historyIndex - 1;
      const url = currentTab.history[newIndex];
      updateTab(activeTab, { historyIndex: newIndex, url });
      loadUrlForTab(activeTab, url);
    }
  };

  const handleForward = () => {
    if (!currentTab) return;
    if (currentTab.historyIndex < currentTab.history.length - 1) {
      const newIndex = currentTab.historyIndex + 1;
      const url = currentTab.history[newIndex];
      updateTab(activeTab, { historyIndex: newIndex, url });
      loadUrlForTab(activeTab, url);
    }
  };

  const handleRefresh = () => {
    if (currentTab?.currentUrl) {
      loadUrlForTab(activeTab, currentTab.currentUrl);
    }
  };

  const handleHome = () => {
    if (!currentTab) return;
    updateTab(activeTab, {
      url: "",
      currentUrl: "",
      displayUrl: "",
      proxyContent: "",
      error: null,
      title: "New Tab"
    });
  };

  const addNewTab = () => {
    const newTab: TabState = {
      id: `tab-${Date.now()}`,
      url: "",
      currentUrl: "",
      displayUrl: "",
      isLoading: false,
      error: null,
      history: [],
      historyIndex: -1,
      proxyContent: "",
      title: "New Tab"
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
      setActiveTab(newTabs[newActiveIndex].id);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.src = "";
        setIsPlaying(false);
      } else {
        audioRef.current.src = "https://www.youtube.com/embed/99H578iry8s?autoplay=1&loop=1&playlist=99H578iry8s";
        setIsPlaying(true);
      }
    }
  };

  const toggleBookmark = () => {
    if (!currentTab?.currentUrl) return;
    
    const existingBookmark = bookmarks.find(b => b.url === currentTab.currentUrl);
    if (existingBookmark) {
      setBookmarks(bookmarks.filter(b => b.id !== existingBookmark.id));
      toast({ title: "Bookmark removed" });
    } else {
      const newBookmark: Bookmark = {
        id: `bookmark-${Date.now()}`,
        title: currentTab.title,
        url: currentTab.currentUrl
      };
      setBookmarks([...bookmarks, newBookmark]);
      toast({ title: "Bookmark added" });
    }
  };

  const isBookmarked = currentTab?.currentUrl && bookmarks.some(b => b.url === currentTab.currentUrl);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      toast({ title: "Fullscreen Mode", description: "Press ESC twice to exit" });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setEscPressCount(prev => prev + 1);
        
        if (escTimerRef.current) {
          clearTimeout(escTimerRef.current);
        }
        
        if (escPressCount + 1 >= 2) {
          setIsFullscreen(false);
          setEscPressCount(0);
          toast({ title: "Exited Fullscreen" });
        } else {
          toast({ title: "Press ESC one more time to exit fullscreen" });
          escTimerRef.current = setTimeout(() => {
            setEscPressCount(0);
          }, 1000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (escTimerRef.current) {
        clearTimeout(escTimerRef.current);
      }
    };
  }, [isFullscreen, escPressCount, toast]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Tabs Bar */}
      {!isFullscreen && (
      <div className="glass-morphism border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center gap-1 px-2 pt-2">
            <TabsList className="h-9 justify-start bg-transparent p-0 gap-1 flex-shrink-0">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="relative max-w-[200px] px-4 py-2 data-[state=active]:bg-background/50 rounded-t-lg"
                >
                  <span className="truncate text-sm">{tab.title}</span>
                  {tabs.length > 1 && (
                    <span
                      onClick={(e) => closeTab(tab.id, e)}
                      className="ml-2 hover:bg-muted rounded-sm p-0.5 cursor-pointer inline-flex"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </TabsTrigger>
              ))}
              <Button
                variant="ghost"
                size="icon"
                onClick={addNewTab}
                className="h-9 w-9 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TabsList>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 flex-shrink-0"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </Tabs>
      </div>
      )}

      {/* Browser Chrome */}
      {!isFullscreen && (
      <div className="glass-morphism border-b">
        <div className="flex items-center gap-2 p-3">
          {/* Navigation Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={!currentTab || currentTab.historyIndex <= 0}
              className="transition-smooth hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForward}
              disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1}
              className="transition-smooth hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={!currentTab?.currentUrl}
              className="transition-smooth hover:bg-secondary"
            >
              <RotateCw className={`h-4 w-4 ${currentTab?.isLoading ? "animate-spin" : ""}`} />
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
                value={currentTab?.url || ""}
                onChange={(e) => updateTab(activeTab, { url: e.target.value })}
                placeholder="Enter a website URL..."
                className="pl-10 bg-input border-border focus-visible:ring-primary transition-smooth"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              disabled={!currentTab?.currentUrl}
              className="transition-smooth hover:bg-secondary"
              title="Bookmark this page"
            >
              <Star className={`h-4 w-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowMathSolver(!showMathSolver)}
              className="transition-smooth hover:bg-secondary"
              title="Math AI Solver"
            >
              <Calculator className="h-4 w-4" />
            </Button>
            <Button 
              type="submit" 
              disabled={!currentTab?.url || currentTab?.isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth min-w-[80px]"
            >
              {currentTab?.isLoading ? (
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
      )}

      {/* Fullscreen Exit Indicator */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-50 glass-morphism px-4 py-2 rounded-lg flex items-center gap-2 animate-fade-in">
          <span className="text-sm text-muted-foreground">Press ESC twice to exit fullscreen</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
          >
            <Minimize className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {currentTab?.error && (
        <Alert variant="destructive" className="m-4 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{currentTab.error}</AlertDescription>
        </Alert>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {currentTab?.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin glow-effect" />
              <p className="text-lg font-medium">Loading website...</p>
              <p className="text-sm text-muted-foreground">Fetching through secure proxy</p>
            </div>
          </div>
        )}
        
        {!currentTab?.currentUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-2xl px-4">
              <svg className="h-24 w-auto mx-auto" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path fill="#EA4335" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path fill="#FBBC05" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
                <path fill="#4285F4" d="M225 3v65h-9.5V3h9.5z"/>
                <path fill="#34A853" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
                <path fill="#EA4335" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
              </svg>
              <p className="text-muted-foreground text-sm">
                be a good boi or spankings
              </p>
              
              {/* Music Control */}
              <Button
                onClick={toggleMusic}
                variant="outline"
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause Music
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play Music
                  </>
                )}
              </Button>
              
              {/* Google Search */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const searchInput = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
                  const query = searchInput.value.trim();
                  if (query) {
                    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                    updateTab(activeTab, { url: googleUrl });
                    loadUrlForTab(activeTab, googleUrl);
                    searchInput.value = '';
                  }
                }}
                className="w-full max-w-xl"
              >
                <div className="relative group">
                  <Input
                    type="text"
                    name="search"
                    placeholder="Search Google or type a URL"
                    className="w-full h-12 px-6 text-base rounded-full border-2 border-border hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </form>

              {/* Bookmarks */}
              {bookmarks.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Bookmarks</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {bookmarks.map((bookmark) => (
                      <Button
                        key={bookmark.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateTab(activeTab, { url: bookmark.url });
                          loadUrlForTab(activeTab, bookmark.url);
                        }}
                        className="gap-2 max-w-[200px]"
                      >
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="truncate">{bookmark.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateTab(activeTab, { url: "youtube.com" });
                    loadUrlForTab(activeTab, "youtube.com");
                  }}
                  className="transition-smooth"
                >
                  YouTube
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateTab(activeTab, { url: "crazygames.com" });
                    loadUrlForTab(activeTab, "crazygames.com");
                  }}
                  className="transition-smooth"
                >
                  CrazyGames
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateTab(activeTab, { url: "wikipedia.org" });
                    loadUrlForTab(activeTab, "wikipedia.org");
                  }}
                  className="transition-smooth"
                >
                  Wikipedia
                </Button>
              </div>
            </div>
            
            {/* Hidden YouTube Audio Player */}
            <iframe
              ref={audioRef}
              allow="autoplay"
              className="hidden"
              title="Background Music"
            />
          </div>
        ) : (
          <iframe
            srcDoc={currentTab.proxyContent}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
            title="Proxy Browser"
          />
        )}
      </div>

      {/* Math Solver Extension */}
      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
