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
  title: string;
  url: string;
  bookmarked?: boolean;
}

const vpnRegions = [
  { code: "usa", label: "USA", flag: "🇺🇸" },
  { code: "uk", label: "UK", flag: "🇬🇧" },
  { code: "japan", label: "Japan", flag: "🇯🇵" },
  { code: "canada", label: "Canada", flag: "🇨🇦" },
];

export const ProxyBrowser = () => {
  const initialTab: TabState = { id: "tab-1", title: "Navis Web", url: "" };
  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [showMathSolver, setShowMathSolver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [vpnRegion, setVpnRegion] = useState("usa");
  const [inputValue, setInputValue] = useState("");
  const audioRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const currentTab = tabs.find(t => t.id === activeTab);

  const addNewTab = () => {
    const newTab: TabState = { id: `tab-${Date.now()}`, title: "New Tab", url: "" };
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

  const handleGo = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // If user enters .com/.org/.net link, open directly
    if (/\.(com|org|net)(\/.*)?$/.test(trimmed)) {
      const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      window.open(url, "_blank");
    } else {
      // Otherwise, search Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
      window.open(searchUrl, "_blank");
    }

    setInputValue("");
  };

  const toggleBookmark = (tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t));
  };

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

              <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="h-9 w-9">
                {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </Tabs>
        </div>
      )}

      {/* Address Bar */}
      <div className="glass-morphism border-b p-3 flex items-center gap-2">
        <div className="flex-1 relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
          <Input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter URL or search..."
            className="pl-10 bg-input border-border focus-visible:ring-primary"
            onKeyDown={e => e.key === "Enter" && handleGo()}
          />
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator className="h-4 w-4" /></Button>

        {/* VPN */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setVpnEnabled(!vpnEnabled)} className={`flex items-center gap-1 px-2 py-1 rounded ${vpnEnabled ? "border-green-500" : "border-gray-400"}`}>
            <Shield className={`h-4 w-4 ${vpnEnabled ? "text-green-500" : "text-gray-400"}`} />
            {vpnEnabled && <span className="text-xs font-medium">{vpnRegions.find(r => r.code === vpnRegion)?.flag} {vpnRegion.toUpperCase()}</span>}
          </Button>
          <select value={vpnRegion} onChange={e => setVpnRegion(e.target.value)} className="bg-input border-border px-2 py-1 rounded" disabled={!vpnEnabled}>
            {vpnRegions.map(r => <option key={r.code} value={r.code}>{r.flag} {r.label}</option>)}
          </select>
        </div>

        {/* Bookmark */}
        <Button type="button" variant="ghost" size="icon" onClick={() => toggleBookmark(activeTab)}>
          <Star className={`h-4 w-4 ${currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"}`} />
        </Button>

        <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[80px]" onClick={handleGo}>Go</Button>
      </div>

      {/* Navis Web Home */}
      {inputValue === "" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Navis Web</h1>
          <p className="text-muted-foreground text-lg">Your browser with VPN, bookmarks, and music</p>
          <Button onClick={toggleMusic} variant="outline" className="gap-2">{isPlaying ? <><Pause className="h-4 w-4"/>Pause Music</> : <><Play className="h-4 w-4"/>Play Music</>}</Button>
          <iframe ref={audioRef} allow="autoplay" className="hidden" title="Background Music" />
        </div>
      )}

      {/* Math Solver */}
      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
