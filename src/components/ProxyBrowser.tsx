import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, 
  Loader2, Plus, X, Play, Pause, Calculator, Maximize, Minimize,
  Star // Import the Star icon for bookmarking
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { MathSolver } from "./MathSolver";

// Assuming you have a Popover component for displaying bookmarks
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area"; // For scrollable bookmark list

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

// Define interface for a bookmark
interface Bookmark {
  url: string;
  title: string;
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
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  // New state for bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]); 
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
      new URL(formattedUrl); // Validate URL structure
      const { data, error: proxyError } = await supabase.functions.invoke('proxy', {
        body: { url: formattedUrl }
      });
      if (proxyError) throw new Error(proxyError.message);

      setTabs(prevTabs => {
        const tab = prevTabs.find(t => t.id === tabId);
        if (!tab) return prevTabs;

        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(formattedUrl);
        // Extract title from the proxied content or use hostname
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        const pageTitle = titleMatch && titleMatch[1] ? titleMatch[1] : new URL(formattedUrl).hostname || "New Tab";
        
        return prevTabs.map(t => t.id === tabId ? {
          ...t,
          currentUrl: formattedUrl,
          displayUrl: formattedUrl,
          proxyContent: data,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: false,
          title: pageTitle // Set the dynamically fetched title
        } : t);
      });

      toast({ title: "Success!", description: "Website loaded through proxy" });
    } catch (e) {
      console.error('Error loading URL:', e);
      setTabs(prevTabs => prevTabs.map(t => 
        t.id === tabId ? { ...t, error: "Failed to load website. The site may be down or blocking proxy access. Check the URL for typos.", isLoading: false } : t
      ));
    }
  };

  // Load bookmarks from local storage on component mount
  useEffect(() => {
    const storedBookmarks = localStorage.getItem("browserBookmarks");
    if (storedBookmarks) {
      try {
        setBookmarks(JSON.parse(storedBookmarks));
      } catch (e) {
        console.error("Failed to parse stored bookmarks:", e);
        localStorage.removeItem("browserBookmarks"); // Clear corrupt data
      }
    }
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  // Save bookmarks to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("browserBookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab && currentTab.url) loadUrlForTab(activeTab, currentTab.url);
  };

  const handleBack = () => {
    if (!currentTab) return;
    if (currentTab.historyIndex > 0) {
      const newIndex = currentTab.historyIndex - 1;
      const url = currentTab.history[newIndex];
      // When navigating history, update the tab's url input as well
      updateTab(activeTab, { historyIndex: newIndex, url });
      loadUrlForTab(activeTab, url);
    }
  };

  const handleForward = () => {
    if (!currentTab) return;
    if (currentTab.historyIndex < currentTab.history.length - 1) {
      const newIndex = currentTab.historyIndex + 1;
      const url = currentTab.history[newIndex];
      // When navigating history, update the tab's url input as well
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
      url: "https://navis-proxy-v4.vercel.app/search.html", // Set initial home page
      currentUrl: "",
      displayUrl: "",
      proxyContent: "",
      error: null,
      title: "New Tab"
    });
    // Load the home page immediately
    loadUrlForTab(activeTab, "https://navis-proxy-v4.vercel.app/search.html");
  };

  const addNewTab = () => {
    const newTab: TabState = {
      id: `tab-${Date.now()}`,
      url: "https://navis-proxy-v4.vercel.app/search.html", // Default URL for new tabs
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
    loadUrlForTab(newTab.id, newTab.url); // Load content for the new tab
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      toast({
        title: "Cannot close last tab",
        description: "You must have at least one tab open.",
        variant: "destructive"
      });
      return;
    }
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
        audioRef.current.src = ""; // Stop playing
        audioRef.current.removeAttribute('src'); // Ensure it's fully cleared
        setIsPlaying(false);
      } else {
        // Use a direct YouTube embed URL that auto-plays and loops.
        // Note: Autoplay might be blocked by browsers if not initiated by user interaction.
        // This button click generally counts as user interaction.
        audioRef.current.src = "https://www.youtube.com/embed/99H578iry8s?autoplay=1&loop=1&playlist=99H578iry8s";
        setIsPlaying(true);
      }
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        toast({
          title: "Fullscreen failed",
          description: "Your browser might be preventing fullscreen access.",
          variant: "destructive"
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
      });
    }
  };

  // Bookmark functions
  const isBookmarked = (url: string) => {
    return bookmarks.some(b => b.url === url);
  };

  const toggleBookmark = () => {
    if (!currentTab || !currentTab.currentUrl) {
      toast({ title: "Cannot Bookmark", description: "No page is currently loaded.", variant: "destructive" });
      return;
    }

    const currentUrl = currentTab.currentUrl;
    const bookmarkTitle = currentTab.title || new URL(currentUrl).hostname || "Untitled Page";

    if (isBookmarked(currentUrl)) {
      setBookmarks(bookmarks.filter(b => b.url !== currentUrl));
      toast({ title: "Bookmark Removed", description: `Removed "${bookmarkTitle}" from bookmarks.` });
    } else {
      setBookmarks([...bookmarks, { url: currentUrl, title: bookmarkTitle }]);
      toast({ title: "Bookmark Added", description: `Added "${bookmarkTitle}" to bookmarks.` });
    }
  };

  const goToBookmark = (url: string) => {
    if (currentTab) {
      updateTab(activeTab, { url: url });
      loadUrlForTab(activeTab, url);
    }
  };

  const removeBookmark = (urlToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent triggering other events like "goToBookmark" if inside a clickable element
    setBookmarks(bookmarks.filter(b => b.url !== urlToRemove));
    toast({ title: "Bookmark Removed", description: "Bookmark successfully removed." });
  };


  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Tabs Bar */}
      {!isFullScreen && (
        <div className="glass-morphism border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between px-2">
              <TabsList className="h-9 flex items-center gap-1 bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="relative max-w-[200px] px-4 py-2 data-[state=active]:bg-background/50 rounded-t-lg group"
                  >
                    <span className="truncate text-sm">{tab.title}</span>
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-sm p-0.5"
                        title="Close tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </TabsTrigger>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={addNewTab}
                  className="h-9 w-9"
                  title="New Tab"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TabsList>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullScreen}
                className="h-9 w-9"
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </Tabs>
        </div>
      )}

      {/* Browser Chrome */}
      <div className="glass-morphism border-b">
        <div className="flex items-center gap-2 p-3">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={!currentTab || currentTab.historyIndex <= 0}
              className="transition-smooth hover:bg-secondary"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForward}
              disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1}
              className="transition-smooth hover:bg-secondary"
              title="Forward"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={!currentTab?.currentUrl}
              className="transition-smooth hover:bg-secondary"
              title="Refresh"
            >
              <RotateCw className={`h-4 w-4 ${currentTab?.isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHome}
              className="transition-smooth hover:bg-secondary"
              title="Home"
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
                value={tabs.find(t => t.id === activeTab)?.url || ""} // Ensure controlled input with active tab's URL
                onChange={(e) => updateTab(activeTab, { url: e.target.value })}
                placeholder="Enter a website URL..."
                className="pl-10 bg-input border-border focus-visible:ring-primary transition-smooth"
              />
            </div>
            
            {/* Bookmark Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              className={`transition-smooth ${isBookmarked(currentTab?.currentUrl || "") ? 'text-yellow-400 hover:text-yellow-500' : 'hover:bg-secondary'}`}
              title={isBookmarked(currentTab?.currentUrl || "") ? "Remove Bookmark" : "Add Bookmark"}
              disabled={!currentTab?.currentUrl}
            >
              <Star className="h-4 w-4 fill-current" /> {/* Use fill-current when bookmarked */}
            </Button>

            {/* Bookmarks Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="transition-smooth hover:bg-secondary" title="View Bookmarks">
                  <Star className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <ScrollArea className="h-72 w-full rounded-md">
                  <div className="p-4">
                    <h4 className="mb-4 text-sm font-medium leading-none">Your Bookmarks</h4>
                    {bookmarks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bookmarks yet. Add one!</p>
                    ) : (
                      <div className="-mx-2"> {/* Negative margin to align with popover padding */}
                        {bookmarks.map((bookmark, index) => (
                          <div 
                            key={index} 
                            onClick={() => goToBookmark(bookmark.url)}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm mb-1"
                          >
                            <span className="truncate pr-2 max-w-[calc(100%-24px)]">{bookmark.title || bookmark.url}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => removeBookmark(bookmark.url, e)}
                              title="Delete bookmark"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>


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
        
        {/* Conditional rendering for initial "New Tab" page or loaded content */}
        {!currentTab?.currentUrl && activeTab === initialTab.id ? ( // Only show intro on the *initial* tab if no URL is loaded
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-md px-4">
              <Shield className="h-20 w-20 text-primary mx-auto glow-effect" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Navis Web
              </h1>
              <p className="text-muted-foreground text-lg">Bypass these dictators</p>
              
              {/* Music Control */}
              <Button onClick={toggleMusic} variant="outline" className="gap-2">
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
                className="w-full"
              >
                <Input type="text" name="search" placeholder="Search Google..." className="w-full bg-input border-border focus-visible:ring-primary" />
              </form>
            </div>

            <iframe ref={audioRef} allow="autoplay" className="hidden" title="Background Music" />
          </div>
        ) : (
           // Render the iframe for any tab that has currentUrl (even if it's the initial tab with a loaded URL)
          <iframe
            srcDoc={currentTab?.proxyContent} // Use currentTab.proxyContent
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
