import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Shield, Plus, X, Play, Pause, Calculator, Maximize, Minimize, Star
} from "lucide-react";
import { MathSolver } from "./MathSolver";

interface TabState {
  id: string;
  url: string;
  title: string;
  bookmarked: boolean;
  history: string[];
  historyIndex: number;
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
    url: "",
    title: "Navis Web",
    bookmarked: false,
    history: [],
    historyIndex: -1
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMathSolver, setShowMathSolver] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [vpnRegion, setVpnRegion] = useState("usa");

  const audioRef = useRef<HTMLIFrameElement>(null);

  const currentTab = tabs.find(t => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const navigateInput = (input: string) => {
    if (!input) return;
    let url = input;
    if (!input.startsWith("http")) {
      url = input.endsWith(".com") ? `https://${input}` : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
    updateTab(activeTab, {
      url,
      history: [...(currentTab?.history || []), url],
      historyIndex: (currentTab?.historyIndex || -1) + 1,
      title: url.endsWith(".com") ? new URL(url).hostname : "Google Search"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value.trim();
    navigateInput(val);
  };

  const addNewTab = () => {
    const newTab: TabState = { ...initialTab, id: `tab-${Date.now()}` };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) setActiveTab(newTabs[0].id);
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

  const toggleBookmark = (tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t));
  };

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
              <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="h-9 w-9">
                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </Tabs>
        </div>
      )}

      {/* Browser Bar */}
      <div className="glass-morphism border-b p-3 flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
          <div className="flex-1 relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
            <Input name="search" placeholder="Enter website or search..." className="pl-10 bg-input border-border focus-visible:ring-primary" />
          </div>
          <Button type="submit" className="bg-primary text-primary-foreground">Go</Button>

          <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator className="h-4 w-4" /></Button>

          <Button variant="outline" size="sm" onClick={() => setVpnEnabled(!vpnEnabled)} className={`flex items-center gap-1 px-2 py-1 rounded ${vpnEnabled ? "border-green-500" : "border-gray-400"}`}>
            <Shield className={`h-4 w-4 ${vpnEnabled ? "text-green-500" : "text-gray-400"}`} />
            {vpnEnabled && <span className="text-xs font-medium">{vpnRegions.find(r => r.code === vpnRegion)?.flag} {vpnRegion.toUpperCase()}</span>}
          </Button>
          <select value={vpnRegion} onChange={(e) => setVpnRegion(e.target.value)} disabled={!vpnEnabled} className="bg-input border-border px-2 py-1 rounded">
            {vpnRegions.map(r => <option key={r.code} value={r.code}>{r.flag} {r.label}</option>)}
          </select>

          <Button type="button" variant="ghost" size="icon" onClick={() => toggleBookmark(activeTab)}>
            <Star className={`h-4 w-4 ${currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"}`} />
          </Button>
        </form>
      </div>

      {/* Main content */}
      <div className="flex-1 relative bg-card">
        {!currentTab?.url && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <Shield className="h-20 w-20 text-primary mx-auto glow-effect" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Navis Web</h1>
            <p className="text-muted-foreground text-lg">Bypass these dictators</p>
            <Button onClick={toggleMusic} variant="outline">{isPlaying ? <><Pause className="h-4 w-4"/> Pause</> : <><Play className="h-4 w-4"/> Play</>}</Button>
          </div>
        )}
        {currentTab?.url && (
          <iframe src={currentTab.url} className="w-full h-full border-0" title={currentTab.title} />
        )}
        <iframe ref={audioRef} allow="autoplay" className="hidden" title="Background Music" />
      </div>

      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
