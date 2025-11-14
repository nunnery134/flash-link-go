import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, Loader2, 
  Plus, X, Play, Pause, Calculator, Maximize, Minimize, Star 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  title: string;
  bookmarked?: boolean;
}

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
    title: "New Tab",
    bookmarked: false
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const audioRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const currentTab = tabs.find(t => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const loadUrlForTab = (tabId: string, url: string) => {
    updateTab(tabId, { currentUrl: url, displayUrl: url, isLoading: true, error: null });
    setTimeout(() => {
      updateTab(tabId, { isLoading: false }); // Simulate load
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTab?.url) return;

    const input = currentTab.url.trim();

    // Check if input looks like a URL
    if (
      input.endsWith(".com") ||
      input.endsWith(".org") ||
      input.endsWith(".net") ||
      input.endsWith(".io") ||
      input.endsWith(".co") ||
      input.endsWith(".gov")
    ) {
      const url = input.startsWith("http") ? input : `https://${input}`;
      updateTab(activeTab, { url });
      loadUrlForTab(activeTab, url);
    } else {
      // Google search for anything else
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      window.open(googleUrl, "_blank");
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
    updateTab(activeTab, { url: "", currentUrl: "", displayUrl: "", error: null, title: "New Tab" });
  };

  const addNewTab = () => {
    const newTab: TabState = { id: `tab-${Date.now()}`, url: "", currentUrl: "", displayUrl: "", isLoading: false, error: null, history: [], historyIndex: -1, title: "New Tab", bookmarked: false };
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
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.src = "";
      setIsPlaying(false);
    } else {
      audioRef.current.src = "https://www.youtube.com/embed/99H578iry8s?autoplay=1&loop=1&playlist=99H578iry8s";
      setIsPlaying(true);
    }
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const toggleBookmark = (tabId: string) => { setTabs(prev => prev.map(t => t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t)); };

  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Tabs Bar */}
      {!isFullScreen && (
        <div className="glass-morphism border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between px-2">
              <TabsList className="h-9 flex items-center gap-1 bg-transparent p-0">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="relative max-w-[200px] px-4 py-2 data-[state=active]:bg-background/50 rounded-t-lg">
                    <span className="truncate text-sm">{tab.title}</span>
                    {tabs.length > 1 && <button onClick={(e) => closeTab(tab.id, e)} className="ml-2 hover:bg-muted rounded-sm p-0.5"><X className="h-3 w-3" /></button>}
                  </TabsTrigger>
                ))}
                <Button variant="ghost" size="icon" onClick={addNewTab} className="h-9 w-9"><Plus className="h-4 w-4" /></Button>
              </TabsList>

              <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="h-9 w-9">
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
            <Button variant="ghost" size="icon" onClick={handleBack} disabled={!currentTab || currentTab.historyIndex <= 0}><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleForward} disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1}><ArrowRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!currentTab?.currentUrl}><RotateCw className={`h-4 w-4 ${currentTab?.isLoading ? "animate-spin" : ""}`} /></Button>
            <Button variant="ghost" size="icon" onClick={handleHome}><Home className="h-4 w-4" /></Button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
            <div className="flex-1 relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
              <Input type="text" value={currentTab?.url || ""} onChange={(e) => updateTab(activeTab, { url: e.target.value })} placeholder="Enter a website or search..." className="pl-10 bg-input border-border focus-visible:ring-primary" />
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" onClick={toggleMusic}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
            <Button type="submit" disabled={!currentTab?.url || currentTab?.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[80px]">
              {currentTab?.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Go"}
            </Button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {currentTab?.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin glow-effect" />
          </div>
        )}

        {currentTab?.currentUrl ? (
          <iframe src={currentTab.currentUrl} className="w-full h-full border-0" title="Browser Content" />
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-muted-foreground">Enter a website or search above</h2>
          </div>
        )}
        <iframe ref={audioRef} allow="autoplay" className="hidden" title="Background Music" />
      </div>

      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
