import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Play,
  Pause,
  Calculator,
  Star,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client"; // Ensure this path is correct
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"; // Assuming you have these for MathSolver

// Dummy MathSolver component if you don't have the real one available
// If you have the actual MathSolver component, replace this with its actual import and definition.
interface MathSolverProps {
  onClose: () => void;
}

const MathSolver: React.FC<MathSolverProps> = ({ onClose }) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const solveExpression = () => {
    try {
      // Basic evaluation for demonstration purposes.
      // In a real MathSolver, you'd use a more robust mathematical expression parser/evaluator.
      const evaluatedResult = eval(expression); // WARNING: eval() is dangerous for untrusted input
      setResult(`Result: ${evaluatedResult}`);
    } catch (e) {
      setResult('Error: Invalid expression');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Math Solver</DialogTitle>
          <DialogDescription>
            Enter a mathematical expression to solve.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="e.g., 2 + 2 * 3"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
          />
          <Button onClick={solveExpression}>Solve</Button>
          {result && <p className="text-sm text-foreground">{result}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


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
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (isPlaying && !isMinimized) { // Only play if not minimized
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
  }, [isPlaying, currentIndex, isMinimized]); // Add isMinimized to dependencies

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

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    // When minimizing, if playing, immediately stop external iframe playback
    if (!isMinimized && isPlaying && iframeRef.current) {
        iframeRef.current.src = "";
    }
  };

  useEffect(() => {
    if (iframeRef.current) {
      // Set iframe src only if playing and not minimized
      iframeRef.current.src = isPlaying && !isMinimized ? currentSong.url : "";
    }
  }, [isPlaying, currentIndex, isMinimized, currentSong.url]);

  return (
    <div
      className={`fixed bottom-4 left-4 glass-morphism p-4 rounded-xl shadow-lg border border-border z-50 transition-all duration-300 ${
        isMinimized ? "w-20" : "w-64"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-primary">
          {isMinimized ? "🎵" : "🎵 Navis Radio"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMinimize}
          className="h-6 w-6"
        >
          {isMinimized ? (
            <Maximize className="h-3 w-3" />
          ) : (
            <Minimize className="h-3 w-3" />
          )}
        </Button>
      </div>

      {!isMinimized && (
        <>
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
        </>
      )}

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
    url: "",
    currentUrl: "",
    displayUrl: "",
    isLoading: false,
    error: null,
    history: [],
    historyIndex: -1,
    proxyContent: "",
    title: "New Tab",
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [escPressCount, setEscPressCount] = useState<number>(0);
  const escTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const currentTab = tabs.find((t) => t.id === activeTab);

  const updateTab = useCallback((id: string, updates: Partial<TabState>) => {
    setTabs((prevTabs) => prevTabs.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const validateAndFormatUrl = useCallback((input: string): string => {
    let formattedUrl = input.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    return formattedUrl;
  }, []);

  const loadUrlForTab = useCallback(async (tabId: string, targetUrl: string) => {
    const formattedUrl = validateAndFormatUrl(targetUrl);
    updateTab(tabId, { isLoading: true, error: null });

    try {
      new URL(formattedUrl); // Validate URL format
      const { data, error: proxyError } = await supabase.functions.invoke("proxy", {
        body: { url: formattedUrl },
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }

      setTabs((prevTabs) => {
        const tab = prevTabs.find((t) => t.id === tabId);
        if (!tab) return prevTabs;

        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(formattedUrl);
        let title = "New Tab";
        try {
          const urlObj = new URL(formattedUrl);
          title = urlObj.hostname || "New Tab";
        } catch (e) {
          // If URL is invalid, keep default title
        }


        return prevTabs.map((t) =>
          t.id === tabId
            ? {
                ...t,
                currentUrl: formattedUrl,
                displayUrl: formattedUrl,
                proxyContent: data,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                isLoading: false,
                title,
              }
            : t
        );
      });

      toast({ title: "Success!", description: "Website loaded through proxy" });
    } catch (e: any) {
      console.error("Error loading URL:", e);
      updateTab(tabId, {
        error: `Failed to load website: ${e.message || "The site may be down or blocking proxy access."}`,
        isLoading: false,
      });
      toast({ title: "Error", description: `Failed to load: ${e.message || "Check URL or proxy service."}`, variant: "destructive" });
    }
  }, [updateTab, validateAndFormatUrl, toast]);

  useEffect(() => {
    // Initial load for the first tab
    loadUrlForTab("tab-1", initialTab.url);
  }, [loadUrlForTab, initialTab.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTab || !currentTab.url) return;

    const input = currentTab.url.trim();
    // Simple check: if it contains a space or no dot, assume it's a search query
    // Otherwise, attempt to load it as a URL
    const isSearchQuery = input.includes(' ') || !input.includes('.');

    if (isSearchQuery) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      loadUrlForTab(activeTab, searchUrl);
    } else {
      loadUrlForTab(activeTab, input);
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
    if (currentTab?.currentUrl) loadUrlForTab(activeTab, currentTab.currentUrl);
  };

  const handleHome = () => {
    if (!currentTab) return;
    updateTab(activeTab, {
      url: initialTab.url, // Go to initial configured homepage
      currentUrl: "",
      displayUrl: "",
      proxyContent: "",
      error: null,
      title: "New Tab",
    });
    loadUrlForTab(activeTab, initialTab.url); // Perform actual navigation
  };

  const addNewTab = () => {
    const newTab: TabState = {
      id: `tab-${Date.now()}`,
      url: initialTab.url, // New tabs start with the initial homepage
      currentUrl: "",
      displayUrl: "",
      isLoading: false,
      error: null,
      history: [],
      historyIndex: -1,
      proxyContent: "",
      title: "New Tab",
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    loadUrlForTab(newTab.id, initialTab.url); // Load content for the new tab
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Prevent closing the last tab
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
      setActiveTab(newTabs[newActiveIndex].id);
    }
  };

  const toggleBookmark = () => {
    if (!currentTab?.currentUrl) return;
    const existingBookmark = bookmarks.find((b) => b.url === currentTab.currentUrl);
    if (existingBookmark) {
      setBookmarks(bookmarks.filter((b) => b.id !== existingBookmark.id));
      toast({ title: "Bookmark removed" });
    } else {
      const newBookmark: Bookmark = {
        id: `bookmark-${Date.now()}`,
        title: currentTab.title,
        url: currentTab.currentUrl,
      };
      setBookmarks([...bookmarks, newBookmark]);
      toast({ title: "Bookmark added" });
    }
  };

  const isBookmarked = currentTab?.currentUrl && bookmarks.some((b) => b.url === currentTab.currentUrl);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) toast({ title: "Fullscreen Mode", description: "Press ESC twice to exit" });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setEscPressCount((prev) => prev + 1);
        if (escTimerRef.current) clearTimeout(escTimerRef.current);
        if (escPressCount + 1 >= 2) {
          setIsFullscreen(false);
          setEscPressCount(0);
          toast({ title: "Exited Fullscreen" });
        } else {
          toast({ title: "Notice", description: "Press ESC one more time to exit fullscreen", duration: 1500 });
          escTimerRef.current = setTimeout(() => setEscPressCount(0), 1000);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (escTimerRef.current) clearTimeout(escTimerRef.current);
    };
  }, [isFullscreen, escPressCount, toast]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check for messages from the proxied iframe that request navigation
      if (event.data && event.data.type === 'PROXY_NAVIGATE' && event.data.url) {
        // Ensure the message came from a trusted source if possible, or validate origin
        // For simplicity, we assume messages directly from the proxied content.
        console.log("Received navigation request from iframe:", event.data.url);
        loadUrlForTab(activeTab, event.data.url);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTab, loadUrlForTab]); // Dependencies ensure the latest activeTab and loadUrlForTab are used

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Tabs Bar */}
      {!isFullscreen && (
        <div className="glass-morphism border-b">
          <div className="flex items-center justify-between px-2 pt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow">
              <TabsList className="h-9 justify-start bg-transparent p-0 gap-1 flex-shrink-0 overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative max-w-[200px] px-4 py-2 data-[state=active]:bg-background/50 rounded-t-lg"
                  >
                    <span className="truncate text-sm">{tab.title}</span>
                    {tabs.length > 1 && ( // Only show close button if more than one tab
                      <span
                        onClick={(e) => closeTab(tab.id, e)}
                        className="ml-2 hover:bg-muted rounded-sm p-0.5 cursor-pointer inline-flex items-center justify-center -mr-1"
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
                  title="New Tab"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9 flex-shrink-0 ml-2"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Browser Chrome */}
      {!isFullscreen && (
        <div className="glass-morphism border-b">
          <div className="flex items-center gap-2 p-3">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                disabled={!currentTab || currentTab.historyIndex <= 0}
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleForward}
                disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1}
                title="Forward"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={!currentTab?.currentUrl}
                title="Refresh"
              >
                <RotateCw className={`h-4 w-4 ${currentTab?.isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleHome} title="Home">
                <Home className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
                <Input
                  type="text"
                  value={currentTab?.url || ""}
                  onChange={(e) => updateTab(activeTab, { url: e.target.value })}
                  placeholder="Search Google or enter URL"
                  className="pl-10 bg-input border-border focus-visible:ring-primary transition-smooth"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleBookmark}
                disabled={!currentTab?.currentUrl}
                title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
              >
                <Star className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowMathSolver(!showMathSolver)}
                title="Math Solver"
              >
                <Calculator className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                disabled={!currentTab?.url || currentTab?.isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth min-w-[80px]"
              >
                {currentTab?.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Go"}
              </Button>
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

      {/* Main Content Area (Proxied iframe or New Tab page) */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {!currentTab?.currentUrl || currentTab.url === initialTab.url ? ( // Show new tab page if currentUrl is empty or it's the initial homepage
          <div className="flex flex-col items-center justify-center p-8 h-full overflow-y-auto">
            <div className="text-center space-y-6 max-w-2xl px-4 w-full">
              <div className="mb-8">
                <img
                  src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
                  alt="Google"
                  className="mx-auto mb-4 h-16 opacity-90"
                />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const searchInput = (e.currentTarget.elements.namedItem('search') as HTMLInputElement);
                    if (searchInput?.value.trim()) {
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchInput.value)}`;
                      loadUrlForTab(activeTab, searchUrl);
                    }
                  }}
                  className="max-w-xl mx-auto"
                >
                  <div className="flex gap-2">
                    <Input
                      name="search"
                      type="text"
                      placeholder="Search Google or enter URL"
                      className="bg-input border-border"
                    />
                    <Button type="submit">Search</Button>
                  </div>
                </form>
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
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals" // Added allow-modals
            title="Proxied Content"
          />
        )}
      </div>

      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
      <NavisRadio />
    </div>
  );
};
