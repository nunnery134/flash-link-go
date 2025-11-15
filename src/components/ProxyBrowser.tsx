import { useState, useRef, useEffect } from "react";
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
  Maximize,
  Minimize,
  Star,
  MapPin,
  Power
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

const COUNTRIES = [
  { code: "usa", label: "United States", flag: "🇺🇸" },
  { code: "uk", label: "United Kingdom", flag: "🇬🇧" },
  { code: "japan", label: "Japan", flag: "🇯🇵" },
  { code: "canada", label: "Canada", flag: "🇨🇦" },
  { code: "germany", label: "Germany", flag: "🇩🇪" },
  { code: "australia", label: "Australia", flag: "🇦🇺" },
];

export const ProxyBrowser = () => {
  const initialTab: TabState = {
    id: `tab-1`,
    url: "https://navis-proxy-v4.vercel.app/search.html",
    currentUrl: "",
    displayUrl: "",
    isLoading: false,
    error: null,
    history: [],
    historyIndex: -1,
    proxyContent: "",
    title: "New Tab",
    bookmarked: false,
  };

  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // VPN-specific
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(false);
  const [vpnRegion, setVpnRegion] = useState<string>("usa");
  const [showVpnModal, setShowVpnModal] = useState<boolean>(false);

  const audioRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const currentTab = tabs.find((t) => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs((tabs) => tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)));
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
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === tabId ? { ...t, isLoading: true, error: null } : t))
    );
    try {
      // ensure valid url
      new URL(formattedUrl);

      const { data, error: proxyError } = await supabase.functions.invoke("proxy", {
        body: { url: formattedUrl, region: vpnEnabled ? vpnRegion : undefined },
      });

      if (proxyError) throw new Error(proxyError.message);

      setTabs((prevTabs) => {
        const tab = prevTabs.find((t) => t.id === tabId);
        if (!tab) return prevTabs;
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(formattedUrl);
        const urlObj = new URL(formattedUrl);
        const title = urlObj.hostname || "New Tab";
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
    } catch (e) {
      console.error("Error loading URL:", e);
      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === tabId
            ? {
                ...t,
                error: "Failed to load website. The site may be down or blocking proxy access.",
                isLoading: false,
              }
            : t
        )
      );
    }
  };

  useEffect(() => {
    // initial load
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title: "New Tab",
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
      title: "New Tab",
      bookmarked: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
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
        audioRef.current.src =
          "https://www.youtube.com/embed/99H578iry8s?autoplay=1&loop=1&playlist=99H578iry8s";
        setIsPlaying(true);
      }
    }
  };

  const toggleFullScreen = () => setIsFullScreen((s) => !s);
  const toggleBookmark = (tabId: string) => {
    setTabs((prevTabs) => prevTabs.map((t) => (t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t)));
  };

  // VPN modal controls
  const openVpnModal = () => setShowVpnModal(true);
  const closeVpnModal = () => setShowVpnModal(false);
  const selectVpnRegion = (code: string) => setVpnRegion(code);
  const toggleVpnPower = () => setVpnEnabled((v) => !v);

  // small helper to get current flag
  const currentCountry = COUNTRIES.find((c) => c.code === vpnRegion);

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
                    className="relative max-w-[200px] px-4 py-2 data-[state=active]:bg-background/50 rounded-t-lg"
                  >
                    <span className="truncate text-sm">{tab.title}</span>
                    {tabs.length > 1 && (
                      <button onClick={(e) => closeTab(tab.id, e)} className="ml-2 hover:bg-muted rounded-sm p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </TabsTrigger>
                ))}
                <Button variant="ghost" size="icon" onClick={addNewTab} className="h-9 w-9">
                  <Plus className="h-4 w-4" />
                </Button>
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
          {/* Navigation */}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleBack} disabled={!currentTab || currentTab.historyIndex <= 0} className="transition-smooth hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleForward} disabled={!currentTab || currentTab.historyIndex >= currentTab.history.length - 1} className="transition-smooth hover:bg-secondary">
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={!currentTab?.currentUrl} className="transition-smooth hover:bg-secondary">
              <RotateCw className={`h-4 w-4 ${currentTab?.isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleHome} className="transition-smooth hover:bg-secondary">
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* Address Bar + Calculator + VPN + Bookmark */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
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

            <Button type="button" variant="ghost" size="icon" onClick={() => setShowMathSolver(!showMathSolver)} className="transition-smooth hover:bg-secondary" title="Math AI Solver">
              <Calculator className="h-4 w-4" />
            </Button>

            {/* Navi VPN (opens modal) */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={openVpnModal}
                title={`Navis VPN ${vpnEnabled ? "ON" : "OFF"} - ${currentCountry?.label || ""}`}
                className="flex items-center gap-1"
              >
                {/* small flag + pin */}
                <span className="mr-1">{currentCountry?.flag || "🌐"}</span>
                <Shield className={`h-4 w-4 ${vpnEnabled ? "text-green-500" : "text-gray-400"}`} />
              </Button>

              <select value={vpnRegion} onChange={(e) => setVpnRegion(e.target.value)} className="bg-input border-border px-2 py-1 rounded" disabled={!vpnEnabled}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bookmark */}
            <Button type="button" variant="ghost" size="icon" onClick={() => toggleBookmark(activeTab)} title="Bookmark">
              <Star className={`h-4 w-4 ${currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"}`} />
            </Button>

            <Button type="submit" disabled={!currentTab?.url || currentTab?.isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth min-w-[80px]">
              {currentTab?.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading
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

        {!currentTab?.currentUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-md px-4">
              <Shield className="h-20 w-20 text-primary mx-auto glow-effect" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Navis Web</h1>
              <p className="text-muted-foreground text-lg">Bypass these dictators</p>

              {/* Music Control */}
              <Button onClick={toggleMusic} variant="outline" className="gap-2">
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause Music
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play Music
                  </>
                )}
              </Button>

              {/* Google Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const searchInput = e.currentTarget.elements.namedItem("search") as HTMLInputElement;
                  const query = searchInput.value.trim();
                  if (query) {
                    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                    updateTab(activeTab, { url: googleUrl });
                    loadUrlForTab(activeTab, googleUrl);
                    searchInput.value = "";
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
          <iframe srcDoc={currentTab.proxyContent} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" title="Proxy Browser" />
        )}
      </div>

      {/* Math Solver Extension */}
      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}

      {/* === VPN Modal (Option A - Popup center) === */}
      {showVpnModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeVpnModal} />

          <div className="relative z-70 w-full max-w-2xl p-6 rounded-xl bg-gradient-to-br from-[#0f0226] to-[#1b0038] border border-purple-700/40 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-purple-300" />
                <div>
                  <h3 className="text-lg font-bold">Navis Proxy</h3>
                  <p className="text-sm text-muted-foreground">Choose a country and power the proxy on</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm flex items-center gap-2">
                  <span className="text-2xl">{currentCountry?.flag || "🌐"}</span>
                  <span>{currentCountry?.label}</span>
                </div>
                <button className="p-2 rounded-md hover:bg-white/5" onClick={closeVpnModal} aria-label="Close VPN">
                  <X className="h-4 w-4 text-purple-200" />
                </button>
              </div>
            </div>

            {/* Neon globe + countries list */}
            <div className="flex gap-6">
              {/* Globe: simple SVG with neon glow */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-52 h-52 rounded-full flex items-center justify-center relative">
                  <svg viewBox="0 0 100 100" className="w-52 h-52">
                    <defs>
                      <radialGradient id="glow" cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#9b5cff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b0066" stopOpacity="0.15" />
                      </radialGradient>
                      <filter id="fancyGlow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <circle cx="50" cy="50" r="30" fill="url(#glow)" filter="url(#fancyGlow)" />
                    {/* latitude lines */}
                    <g stroke="#b98cff" strokeWidth="0.6" strokeOpacity="0.9" fill="none">
                      <ellipse cx="50" cy="50" rx="24" ry="8" />
                      <ellipse cx="50" cy="50" rx="20" ry="6" />
                      <ellipse cx="50" cy="50" rx="16" ry="4" />
                    </g>
                    {/* longitude lines */}
                    <g stroke="#d7b7ff" strokeWidth="0.5" strokeOpacity="0.8" fill="none">
                      <path d="M50 20 A30 30 0 0 1 80 50" />
                      <path d="M50 20 A30 30 0 0 0 20 50" />
                      <path d="M50 80 A30 30 0 0 1 80 50" />
                      <path d="M50 80 A30 30 0 0 0 20 50" />
                    </g>
                    {/* center sparkle */}
                    <circle cx="50" cy="50" r="1.8" fill="#fff6" />
                  </svg>

                  {/* floating pointer for selected country */}
                  <div className="absolute bottom-4 right-6 flex items-center gap-2">
                    <span className="text-2xl animate-bounce">{currentCountry?.flag}</span>
                    <div className="text-sm text-purple-100">{currentCountry?.label}</div>
                  </div>
                </div>
              </div>

              {/* Countries list + power */}
              <div className="w-64 flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => selectVpnRegion(c.code)}
                      className={`flex items-center gap-3 p-2 rounded-lg text-left hover:bg-white/5 transition ${
                        vpnRegion === c.code ? "ring-2 ring-purple-400 bg-white/5" : ""
                      }`}
                    >
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <div className="font-medium">{c.label}</div>
                        <div className="text-xs text-muted-foreground">Route via {c.label}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  {/* Power button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Power</div>
                      <div className="text-xs text-muted-foreground">Toggle Navis Proxy</div>
                    </div>

                    <Button
                      onClick={() => {
                        toggleVpnPower();
                        // optionally keep modal open; you could close here if desired
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
                        vpnEnabled ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-white/5 hover:bg-white/10 text-purple-300"
                      }`}
                    >
                      <Power className="h-4 w-4" />
                      <span className="font-medium">{vpnEnabled ? "ON" : "OFF"}</span>
                    </Button>
                  </div>

                  {/* small hint */}
                  <p className="text-xs text-muted-foreground mt-3">
                    When Navis Proxy is ON, new site loads will route through the selected country. You can also use the selector in the address bar when Navis is ON.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
