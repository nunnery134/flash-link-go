import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Loader2, Plus, X, Play, Pause, Calculator, Maximize, Minimize, Star 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MathSolver } from "./MathSolver";

interface TabState {
  id: string;
  url: string;
  currentUrl: string;
  title: string;
  isLoading: boolean;
  bookmarked?: boolean;
}

const vpnRegions = [
  { code: "usa", label: "USA", flag: "🇺🇸" },
  { code: "uk", label: "UK", flag: "🇬🇧" },
  { code: "japan", label: "Japan", flag: "🇯🇵" },
  { code: "canada", label: "Canada", flag: "🇨🇦" },
];

// Free CORS proxy
const PROXY = "https://corsproxy.io/?";

export const ProxyBrowser = () => {
  const initialTab: TabState = {
    id: "tab-1",
    url: "",
    currentUrl: "",
    title: "New Tab",
    isLoading: false,
    bookmarked: false
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(false);
  const [vpnRegion, setVpnRegion] = useState<string>("usa");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const audioRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const currentTab = tabs.find(t => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Google search suggestions
  useEffect(() => {
    if (!currentTab?.url) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(currentTab.url)}`, { signal: controller.signal });
        const data = await res.json();
        setSuggestions(data[1].slice(0, 5));
      } catch {}
    };
    fetchSuggestions();

    return () => controller.abort();
  }, [currentTab?.url]);

  const handleSubmit = (e: React.FormEvent | string) => {
    e.preventDefault && e.preventDefault();
    const input = typeof e === "string" ? e : currentTab?.url;
    if (!input) return;

    let targetUrl: string;
    if (
      input.endsWith(".com") ||
      input.endsWith(".org") ||
      input.endsWith(".net") ||
      input.endsWith(".io") ||
      input.endsWith(".co") ||
      input.endsWith(".gov")
    ) {
      targetUrl = input.startsWith("http") ? input : `https://${input}`;
    } else {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }

    const proxyUrl = `${PROXY}${encodeURIComponent(targetUrl)}${vpnEnabled ? `&region=${vpnRegion}` : ""}`;
    updateTab(activeTab, { currentUrl: proxyUrl, isLoading: true });
    setSuggestions([]);
    setTimeout(() => updateTab(activeTab, { isLoading: false }), 800);
  };

  const addNewTab = () => {
    const newTab: TabState = { id: `tab-${Date.now()}`, url: "", currentUrl: "", title: "New Tab", isLoading: false, bookmarked: false };
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
  const toggleBookmark = (tabId: string) => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t));

  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Tabs */}
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

      {/* Address Bar */}
      <div className="glass-morphism border-b relative">
        <div className="flex items-center gap-2 p-3">
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
            <div className="flex-1 relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
              <Input
                type="text"
                value={currentTab?.url || ""}
                onChange={(e) => updateTab(activeTab, { url: e.target.value })}
                placeholder="Enter website or search..."
                className="pl-10 bg-input border-border focus-visible:ring-primary"
              />
              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-card border border-border rounded mt-1 z-20">
                  {suggestions.map(s => (
                    <li
                      key={s}
                      onClick={() => handleSubmit(s)}
                      className="px-3 py-2 cursor-pointer hover:bg-background/50"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)}> <Calculator className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" onClick={toggleMusic}> {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} </Button>

            {/* VPN */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setVpnEnabled(!vpnEnabled)} className={`flex items-center gap-1 px-2 py-1 rounded ${vpnEnabled ? "border-green-500" : "border-gray-400"}`}>
                <Shield className={`h-4 w-4 ${vpnEnabled ? "text-green-500" : "text-gray-400"}`} />
                {vpnEnabled && <span className="text-xs font-medium">{vpnRegions.find(r => r.code === vpnRegion)?.flag} {vpnRegion.toUpperCase()}</span>}
              </Button>
              <select value={vpnRegion} onChange={(e) => setVpnRegion(e.target.value)} className="bg-input border-border px-2 py-1 rounded" disabled={!vpnEnabled}>
                {vpnRegions.map(r => <option key={r.code} value={r.code}>{r.flag} {r.label}</option>)}
              </select>
            </div>

            <Button type="button" variant="ghost" size="icon" onClick={() => toggleBookmark(activeTab)}>
              <Star className={`h-4 w-4 ${currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"}`} />
            </Button>

            <Button type="submit" disabled={!currentTab?.url || currentTab?.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[80px]">
              {currentTab?.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Go"}
            </Button>
          </form>
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {currentTab?.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin glow-effect" />
          </div>
        )}
        {currentTab?.currentUrl ? (
          <iframe src={currentTab.currentUrl} className="w-full h-full border-0" title="Browser Content" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
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
