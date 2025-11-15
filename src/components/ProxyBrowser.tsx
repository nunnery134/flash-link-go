import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, Loader2, 
  Plus, X, Play, Pause, Calculator, Maximize, Minimize, Star, Boombox, SkipBack, SkipForward
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

const PLAYLIST = [
  { videoId: "99H578iry8s", title: "Song 1", artist: "Artist 1" },
  { videoId: "NEXT_VIDEO_ID", title: "Song 2", artist: "Artist 2" },
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
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(false);
  const [vpnRegion, setVpnRegion] = useState<string>("usa");
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const currentTab = tabs.find(t => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const validateAndFormatUrl = (input: string) => {
    let url = input.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    return url;
  };

  const loadUrlForTab = async (tabId: string, targetUrl: string) => {
    const formattedUrl = validateAndFormatUrl(targetUrl);
    updateTab(tabId, { isLoading: true, error: null });

    try {
      new URL(formattedUrl);
      const { data, error: proxyError } = await supabase.functions.invoke('proxy', {
        body: { url: formattedUrl, region: vpnEnabled ? vpnRegion : undefined }
      });
      if (proxyError) throw new Error(proxyError.message);

      setTabs(prev => {
        const tab = prev.find(t => t.id === tabId);
        if (!tab) return prev;
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(formattedUrl);
        return prev.map(t => t.id === tabId ? {
          ...t,
          currentUrl: formattedUrl,
          displayUrl: formattedUrl,
          proxyContent: data,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: false,
          title: new URL(formattedUrl).hostname
        } : t);
      });

      toast({ title: "Loaded!", description: "Website loaded via VPN proxy" });
    } catch (e) {
      console.error(e);
      updateTab(tabId, { error: "Failed to load website.", isLoading: false });
    }
  };

  useEffect(() => {
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab?.url) loadUrlForTab(activeTab, currentTab.url);
  };

  const handleBack = () => {
    if (!currentTab || currentTab.historyIndex <= 0) return;
    const newIndex = currentTab.historyIndex - 1;
    updateTab(activeTab, { historyIndex: newIndex, url: currentTab.history[newIndex] });
    loadUrlForTab(activeTab, currentTab.history[newIndex]);
  };

  const handleForward = () => {
    if (!currentTab || currentTab.historyIndex >= currentTab.history.length - 1) return;
    const newIndex = currentTab.historyIndex + 1;
    updateTab(activeTab, { historyIndex: newIndex, url: currentTab.history[newIndex] });
    loadUrlForTab(activeTab, currentTab.history[newIndex]);
  };

  const handleRefresh = () => { if (currentTab?.currentUrl) loadUrlForTab(activeTab, currentTab.currentUrl); };
  const handleHome = () => updateTab(activeTab, { url: "", currentUrl: "", displayUrl: "", proxyContent: "", error: null, title: "New Tab" });
  const addNewTab = () => { const newTab = { ...initialTab, id: `tab-${Date.now()}` }; setTabs([...tabs, newTab]); setActiveTab(newTab.id); };
  const closeTab = (tabId: string, e: React.MouseEvent) => { e.stopPropagation(); if (tabs.length === 1) return; const newTabs = tabs.filter(t => t.id !== tabId); setTabs(newTabs); if (activeTab === tabId) setActiveTab(newTabs[0].id); };
  const toggleBookmark = (tabId: string) => setTabs(prev => prev.map(t => t.id === tabId ? { ...t, bookmarked: !t.bookmarked } : t));

  const toggleMusicPlayer = () => setShowMusicPlayer(prev => !prev);
  const skipNext = () => setCurrentSongIndex((i) => (i + 1) % PLAYLIST.length);
  const skipPrev = () => setCurrentSongIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length);

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player("youtube-player", {
        height: "0", width: "0", videoId: PLAYLIST[currentSongIndex].videoId,
        playerVars: { autoplay: 1, loop: 1, playlist: PLAYLIST.map(s => s.videoId).join(",") },
        events: {
          onReady: (e: any) => { if (isPlaying) e.target.playVideo(); },
          onStateChange: (e: any) => { if (e.data === (window as any).YT.PlayerState.ENDED) skipNext(); }
        }
      });
    };
  }, []);

  useEffect(() => { if (playerRef.current) { playerRef.current.loadVideoById(PLAYLIST[currentSongIndex].videoId); if (isPlaying) playerRef.current.playVideo(); } }, [currentSongIndex]);
  useEffect(() => { const interval = setInterval(() => { if (playerRef.current && isPlaying) { const duration = playerRef.current.getDuration(); const currentTime = playerRef.current.getCurrentTime(); if (duration) setProgress((currentTime / duration) * 100); } }, 500); return () => clearInterval(interval); }, [isPlaying]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Tabs */}
      {!isFullScreen && (
        <div className="glass-morphism border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-2">
              <TabsList className="flex gap-1 bg-transparent p-0">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    <span>{tab.title}</span>
                    {tabs.length > 1 && <button onClick={(e) => closeTab(tab.id, e)}><X /></button>}
                  </TabsTrigger>
                ))}
                <Button onClick={addNewTab}><Plus /></Button>
              </TabsList>
              <Button onClick={() => setIsFullScreen(!isFullScreen)}>{isFullScreen ? <Minimize /> : <Maximize />}</Button>
            </div>
          </Tabs>
        </div>
      )}

      {/* Address bar */}
      <div className="glass-morphism border-b flex items-center gap-2 p-3">
        <div className="flex gap-1">
          <Button onClick={handleBack}><ArrowLeft /></Button>
          <Button onClick={handleForward}><ArrowRight /></Button>
          <Button onClick={handleRefresh}><RotateCw /></Button>
          <Button onClick={handleHome}><Home /></Button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
          <div className="flex-1 relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
            <Input value={currentTab?.url || ""} onChange={(e) => updateTab(activeTab, { url: e.target.value })} placeholder="Enter URL" className="pl-10" />
          </div>
          <Button type="button" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator /></Button>
          <Button type="button" onClick={toggleMusicPlayer}><Boombox /></Button>
          <div className="flex items-center gap-1">
            <Button type="button" onClick={() => setVpnEnabled(!vpnEnabled)}><Shield className={vpnEnabled ? "text-green-500" : "text-gray-400"} /></Button>
            <select value={vpnRegion} onChange={(e) => setVpnRegion(e.target.value)} disabled={!vpnEnabled}>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="japan">Japan</option>
              <option value="canada">Canada</option>
            </select>
          </div>
          <Button type="button" onClick={() => toggleBookmark(activeTab)}><Star className={currentTab?.bookmarked ? "text-yellow-400" : "text-gray-400"} /></Button>
          <Button type="submit" disabled={!currentTab?.url || currentTab?.isLoading}>Go</Button>
        </form>
      </div>

      {currentTab?.error && <Alert><AlertCircle /><AlertDescription>{currentTab.error}</AlertDescription></Alert>}

      {/* Content */}
      <div className="flex-1 relative overflow-hidden bg-card">
        {!currentTab?.currentUrl ? (
          <div className="flex items-center justify-center h-full">Enter a URL or search.</div>
        ) : (
          <iframe srcDoc={currentTab.proxyContent} className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" title="Proxy Browser" />
        )}
      </div>

      {/* Music Player */}
      {showMusicPlayer && (
        <div className="absolute bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg w-80 flex flex-col gap-2">
          <h3 className="font-bold">Navis Radio</h3>
          <p>{PLAYLIST[currentSongIndex].title} - {PLAYLIST[currentSongIndex].artist}</p>
          <div className="flex items-center justify-between">
            <Button onClick={skipPrev}><SkipBack /></Button>
            <Button onClick={() => { isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo(); setIsPlaying(!isPlaying); }}>
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button onClick={skipNext}><SkipForward /></Button>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mt-2">
            <div className="bg-purple-500 h-1" style={{ width: `${progress}%` }} />
          </div>
          <div id="youtube-player" />
        </div>
      )}

      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
    </div>
  );
};
