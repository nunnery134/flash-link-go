import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, Loader2, Plus, X, Play, Pause, Volume2, Calculator, Star, Maximize, Minimize, SkipForward, SkipBack } from "lucide-react";
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

const songs = [
  {
    title: "The Mind Electric",
    artist: "Miracle Musical",
    url: "https://www.youtube.com/embed/tZtCYqPVSp8?autoplay=1",
    duration: 242, // seconds
  },
  {
    title: "Oblivion",
    artist: "Grimes",
    url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1",
    duration: 250,
  },
  {
    title: "Paprika Theme",
    artist: "Susumu Hirasawa",
    url: "https://www.youtube.com/embed/fCeiUX59_FM?autoplay=1",
    duration: 215,
  },
  {
    title: "Repeat Mix",
    artist: "Various Artists",
    url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1&list=RD99H578iry8s",
    duration: 240,
  },
];

const NavisRadio = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (isPlaying) {
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= currentSong.duration) {
            handleNext();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, currentIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setProgress(0);
  };

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = isPlaying ? currentSong.url : "";
    }
  }, [isPlaying, currentIndex]);

  return (
    <div className="fixed bottom-4 left-4 glass-morphism p-4 rounded-xl w-64 shadow-lg border border-border z-50">
      <h2 className="text-sm font-semibold text-primary mb-2 text-center">🎵 Navis Radio</h2>
      <div className="flex items-center justify-center gap-3 mb-3">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handlePlayPause}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <div
          className="h-2 bg-primary transition-all duration-200"
          style={{ width: `${(progress / currentSong.duration) * 100}%` }}
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium truncate">{currentSong.title}</p>
        <p className="text-xs text-muted-foreground">{currentSong.artist}</p>
      </div>

      <iframe
        ref={iframeRef}
        className="hidden"
        allow="autoplay"
        title="Navis Radio"
      />
    </div>
  );
};

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
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [escPressCount, setEscPressCount] = useState<number>(0);
  const escTimerRef = useRef<NodeJS.Timeout | null>(null);
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
      
      toast({ title: "Success!", description: "Website loaded through proxy" });
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
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab && currentTab.url) loadUrlForTab(activeTab, currentTab.url);
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
    if (currentTab?.currentUrl) loadUrlForTab(activeTab, currentTab.currentUrl);
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
    if (!isFullscreen) toast({ title: "Fullscreen Mode", description: "Press ESC twice to exit" });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setEscPressCount(prev => prev + 1);
        if (escTimerRef.current) clearTimeout(escTimerRef.current);
        if (escPressCount + 1 >= 2) {
          setIsFullscreen(false);
          setEscPressCount(0);
          toast({ title: "Exited Fullscreen" });
        } else {
          toast({ title: "Press ESC one more time to exit fullscreen" });
          escTimerRef.current = setTimeout(() => setEscPressCount(0), 1000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (escTimerRef.current) clearTimeout(escTimerRef.current);
    };
  }, [isFullscreen, escPressCount, toast]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROXY_NAVIGATE' && event.data.url) {
        loadUrlForTab(activeTab, event.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTab, loadUrlForTab]);

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
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleBack} disabled={!currentTab || currentTab.historyIndex <= 0}><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleForward} disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1}><ArrowRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!currentTab?.currentUrl}><RotateCw className={`h-4 w-4 ${currentTab?.isLoading ? "animate-spin" : ""}`} /></Button>
            <Button variant="ghost" size="icon" onClick={handleHome}><Home className="h-4 w-4" /></Button>
          </div>
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
            <Button type="button" variant="ghost" size="icon" onClick={toggleBookmark} disabled={!currentTab?.currentUrl}><Star className={`h-4 w-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} /></Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator className="h-4 w-4" /></Button>
            <Button type="submit" disabled={!currentTab?.url || currentTab?.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth min-w-[80px]">{currentTab?.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Go"}</Button>
          </form>
        </div>
      </div>
      )}

      {currentTab?.error && (
        <Alert variant="destructive" className="m-4 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{currentTab.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 relative overflow-hidden bg-card">
        {!currentTab?.currentUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-2xl px-4">
              <div className="mb-8">
                <img 
                  src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" 
                  alt="Google" 
                  className="mx-auto mb-4 h-16 opacity-90"
                />
              </div>

              {bookmarks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-foreground">Bookmarks</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {bookmarks.map((bookmark) => (
                      <Button
                        key={bookmark.id}
                        variant="outline"
                        size="sm"
                        onClick={() => loadUrlForTab(activeTab, bookmark.url)}
                        className="text-xs"
                      >
                        {bookmark.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUrlForTab(activeTab, "https://www.youtube.com")}
                  >
                    YouTube
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUrlForTab(activeTab, "https://www.crazygames.com")}
                  >
                    CrazyGames
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUrlForTab(activeTab, "https://www.wikipedia.org")}
                  >
                    Wikipedia
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            srcDoc={currentTab.proxyContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Proxied Content"
          />
        )}
      </div>

      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
      <NavisRadio />
    </div>
  );
};
