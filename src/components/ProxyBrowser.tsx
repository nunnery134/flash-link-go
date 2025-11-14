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
  bookmarked?: boolean;
}

const vpnRegions = [
  { code: "usa", label: "USA", flag: "🇺🇸" },
  { code: "uk", label: "UK", flag: "🇬🇧" },
  { code: "japan", label: "Japan", flag: "🇯🇵" },
  { code: "canada", label: "Canada", flag: "🇨🇦" },
];

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
    title: "New Tab",
    bookmarked: false
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(false);
  const [vpnRegion, setVpnRegion] = useState<string>("usa");
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
    setTabs(prevTabs => prevTabs.map(t => t.id === tabId ? { ...t, isLoading: true, error: null } : t));
    
    try {
      new URL(formattedUrl);
      const { data, error: proxyError } = await supabase.functions.invoke('proxy', {
        body: { url: formattedUrl, region: vpnEnabled ? vpnRegion : undefined }
      });
      if (proxyError) throw new Error(proxyError.message);

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
      setTabs(prevTabs => prevTabs.map(t => t.id === tabId ? { ...t, error: "Failed to load website. The site may be down or blocking proxy access.", isLoading: false } : t));
    }
  };

  useEffect(() => {
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  // ✅ SMART ADDRESS BAR
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTab?.url) return;

    const input = currentTab.url.trim();

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
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      updateTab(activeTab, { url: googleUrl });
      loadUrlForTab(activeTab, googleUrl);
    }
  };

  const handleBack = () => { if (!currentTab) return; if (currentTab.historyIndex > 0) { const newIndex = currentTab.historyIndex - 1; const url = currentTab.history[newIndex]; updateTab(activeTab, { historyIndex: newIndex, url }); loadUrlForTab(activeTab, url); } };
  const handleForward = () => { if (!currentTab) return; if (currentTab.historyIndex < currentTab.history.length - 1) { const newIndex = currentTab.historyIndex + 1; const url = currentTab.history[newIndex]; updateTab(activeTab, { historyIndex: newIndex, url }); loadUrlForTab(activeTab, url); } };
  const handleRefresh = () => { if (currentTab?.currentUrl) loadUrlForTab(activeTab, currentTab.currentUrl); };
  const handleHome = () => { if (!currentTab) return; updateTab(activeTab, { url: "", currentUrl: "", displayUrl: "", proxyContent: "", error: null, title: "New Tab" }); };
  const addNewTab = () => { const newTab: TabState = { id: `tab-${Date.now()}`, url: "", currentUrl: "", displayUrl: "", isLoading: false, error: null, history: [], historyIndex: -1, proxyContent: "", title: "New Tab", bookmarked: false }; setTabs([...tabs, newTab]); setActiveTab(newTab.id); };
  const closeTab = (tabId: string, e: React.MouseEvent) => { e.stopPropagation(); if (tabs.length === 1) return; const tabIndex = tabs.findIndex(t => t.id === tabId); const newTabs = tabs.filter(t => t.id !== tabId); setTabs(newTabs); if (activeTab === tabId) { const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0; setActiveTab(newTabs[newActiveIndex].id); } };
  const toggleMusic = () => { if (!audioRef.current) return; if (isPlaying) { audioRef.current.src = ""; setIsPlaying(false); } else { audioRef.current.src = "https://www.youtube.com/embed/99H578iry8s?autoplay=1&loop=1&playlist=99H578iry8s"; setIsPlaying(true); } };
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const toggleBookmark = (tabId: string) => { setTabs(prevTabs => prevTabs.map(t => t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t)); };

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

              {/* Fullscreen Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="h-9 w-9" title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
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

          {/* Address Bar + Buttons */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
            <div className="flex-1 relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
              <Input type="text" value={currentTab?.url || ""} onChange={(e) => updateTab(activeTab, { url: e.target.value })} placeholder="Enter a website URL or search..." className="pl-10 bg-input border-border focus-visible:ring-primary" />
            </div>

            {/* Calculator */}
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator className="h-4 w-4" /></Button>

            {/* Navi VPN */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setVpnEnabled(!vpnEnabled)} className={`flex items-center gap-1 px-2 py-1 rounded ${vpnEnabled ? "border-green-500" : "border-gray-400"}`} title={`Navi VPN ${vpnEnabled ? "ON" : "OFF"}`}>
                <Shield className={`h-4 w-4 ${vpnEnabled ? "text-green-500" : "text-gray-400"}`} />
                {vpnEnabled && <span className="text-xs font-medium">{vpnRegions.find(r => r.code === vpnRegion)?.flag} {vpnRegion.toUpperCase()}</span>}
              </Button>
              <select value={vpnRegion} onChange={(e) => setVpnRegion(e.target.value)} className="bg-input border-border px-2 py-1 rounded" disabled={!vpnEnabled}>
                {vpnRegions.map(r => <option key={r.code} value={r.code}>{r.flag} {r.label}</option>)}
              </select>
            </div>

            {/* Bookmark */}
            <Button type="button" variant="ghost" size="icon" onClick={() => toggleBookmark(activeTab)} title="Bookmark">
              <Star className={`h-4 w-4 ${currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"}`} />
            </Button>

            <Button type="submit" disabled={!currentTab?.url || currentTab?.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[80px]">
              {currentTab?.isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading</> : "Go"}
            </Button>
          </form>
        </div>
      </div>

      {/* Error */}
      {currentTab?.error && <Alert variant="destructive" className="m-4 rounded-lg"><AlertCircle className="h-4 w-4" /><AlertDescription>{currentTab.error}</AlertDescription></Alert>}

      {/* Content */}
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
            <div className="text-center space-y-6 max-w-md px-4">
              <Shield className="h-20 w-20 text-primary mx-auto glow-effect" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Navis Web</h1>
              <p className="text-muted-foreground text-lg">Bypass these dictators</p>

              {/* Music */}
              <Button onClick={toggleMusic} variant="outline" className="gap-2">{isPlaying ? <><Pause className="h-4 w-4" />Pause Music</> : <><Play className="h-4 w-4" />Play Music</>}</Button>

            </div>
            <iframe ref={audioRef} allow="autoplay" className="hidden" title="Background Music" />
          </div>
        ) : (
          <iframe srcDoc={currentTab.proxyContent} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" title="Proxy Browser" />
        )}
      </div>

      {/* Math Solver */}
      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
