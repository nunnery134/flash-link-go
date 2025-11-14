import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, Shield, Plus, X, Play, Pause, Calculator, Maximize, Minimize, Star 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MathSolver } from "./MathSolver";

interface TabState {
  id: string;
  url: string;
  currentUrl: string;
  history: string[];
  historyIndex: number;
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
  const { toast } = useToast();
  const audioRef = useRef<HTMLIFrameElement>(null);

  const initialTab: TabState = {
    id: "tab-1",
    url: "",
    currentUrl: "",
    history: [],
    historyIndex: -1,
    title: "Navis Web",
    bookmarked: false,
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [vpnRegion, setVpnRegion] = useState("usa");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMathSolver, setShowMathSolver] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const currentTab = tabs.find(t => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addNewTab = () => {
    const newTab: TabState = {
      id: `tab-${Date.now()}`,
      url: "",
      currentUrl: "",
      history: [],
      historyIndex: -1,
      title: "Navis Web",
      bookmarked: false,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const index = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[index > 0 ? index - 1 : 0].id);
    }
  };

  const navigateTo = (input: string) => {
    if (!currentTab) return;
    let url = "";

    if (
      input.endsWith(".com") ||
      input.endsWith(".org") ||
      input.endsWith(".net") ||
      input.endsWith(".io") ||
      input.endsWith(".co") ||
      input.endsWith(".gov")
    ) {
      url = input.startsWith("http") ? input : `https://${input}`;
    } else {
      // Search Google inside iframe
      url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }

    const newHistory = currentTab.history.slice(0, currentTab.historyIndex + 1);
    newHistory.push(url);
    updateTab(activeTab, {
      url,
      currentUrl: url,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      title: url,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = e.currentTarget.elements.namedItem("search") as HTMLInputElement;
    const query = inputEl.value.trim();
    if (!query) return;
    navigateTo(query);
    inputEl.value = "";
  };

  const handleBack = () => {
    if (!currentTab || currentTab.historyIndex <= 0) return;
    const newIndex = currentTab.historyIndex - 1;
    const url = currentTab.history[newIndex];
    updateTab(activeTab, { historyIndex: newIndex, currentUrl: url });
  };

  const handleForward = () => {
    if (!currentTab || currentTab.historyIndex >= currentTab.history.length - 1) return;
    const newIndex = currentTab.historyIndex + 1;
    const url = currentTab.history[newIndex];
    updateTab(activeTab, { historyIndex: newIndex, currentUrl: url });
  };

  const handleHome = () => {
    if (!currentTab) return;
    updateTab(activeTab, { url: "", currentUrl: "", history: [], historyIndex: -1, title: "Navis Web" });
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

  const toggleBookmark = () => {
    if (!currentTab) return;
    updateTab(activeTab, { bookmarked: !currentTab.bookmarked });
  };

  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Tabs Bar */}
      {!isFullScreen && (
        <div className="glass-morphism border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-2">
              <TabsList className="flex gap-1 p-0">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="relative px-4 py-2 rounded-t-lg">
                    <span className="truncate">{tab.title}</span>
                    {tabs.length > 1 && <button onClick={(e) => closeTab(tab.id, e)} className="ml-2 p-0.5 hover:bg-muted rounded-sm"><X className="h-3 w-3" /></button>}
                  </TabsTrigger>
                ))}
                <Button onClick={addNewTab} variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
              </TabsList>
              <Button onClick={() => setIsFullScreen(!isFullScreen)} variant="ghost" size="icon">
                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </Tabs>
        </div>
      )}

      {/* Browser Chrome */}
      <div className="glass-morphism border-b p-3 flex items-center gap-2">
        <div className="flex gap-1">
          <Button onClick={handleBack} variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          <Button onClick={handleForward} variant="ghost" size="icon"><ArrowRight className="h-4 w-4" /></Button>
          <Button onClick={() => currentTab && updateTab(activeTab, { currentUrl: currentTab.currentUrl })} variant="ghost" size="icon"><RotateCw className="h-4 w-4" /></Button>
          <Button onClick={handleHome} variant="ghost" size="icon"><Home className="h-4 w-4" /></Button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 items-center">
          <div className="flex-1 relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
            <Input type="text" name="search" placeholder="Enter URL or search..." className="pl-10 bg-input border-border" />
          </div>

          <Button onClick={() => setShowMathSolver(!showMathSolver)} variant="ghost" size="icon"><Calculator className="h-4 w-4" /></Button>

          <div className="flex items-center gap-2">
            <Button onClick={() => setVpnEnabled(!vpnEnabled)} variant="outline" size="sm" className={`flex items-center gap-1 px-2 py-1 rounded ${vpnEnabled ? "border-green-500" : "border-gray-400"}`}><Shield className={`h-4 w-4 ${vpnEnabled ? "text-green-500" : "text-gray-400"}`} />{vpnEnabled && <span>{vpnRegions.find(r => r.code === vpnRegion)?.flag} {vpnRegion.toUpperCase()}</span>}</Button>
            <select value={vpnRegion} onChange={(e) => setVpnRegion(e.target.value)} disabled={!vpnEnabled} className="px-2 py-1 rounded bg-input">{vpnRegions.map(r => <option key={r.code} value={r.code}>{r.flag} {r.label}</option>)}</select>
          </div>

          <Button onClick={toggleBookmark} variant="ghost" size="icon"><Star className={`h-4 w-4 ${currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"}`} /></Button>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {!currentTab?.currentUrl ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <Shield className="h-20 w-20 text-primary mx-auto glow-effect" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Navis Web</h1>
            <p className="text-muted-foreground">Bypass these dictators</p>
            <Button onClick={toggleMusic} variant="outline" className="gap-2">{isPlaying ? <><Pause className="h-4 w-4" />Pause Music</> : <><Play className="h-4 w-4" />Play Music</>}</Button>
            <iframe ref={audioRef} allow="autoplay" className="hidden" title="Background Music" />
          </div>
        ) : (
          <iframe src={currentTab.currentUrl} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" title={currentTab.title} />
        )}
      </div>

      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
