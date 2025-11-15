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
  Boombox,
  SkipBack,
  SkipForward,
  Calculator,
  Minimize,
  Maximize,
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

// Playlist info (replace with real titles/artists if desired)
const PLAYLIST = [
  { videoId: "99H578iry8s", title: "Song 1", artist: "Artist 1" },
  { videoId: "NEXT_VIDEO_ID", title: "Song 2", artist: "Artist 2" },
  // add more songs here
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
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [vpnEnabled, setVpnEnabled] = useState<boolean>(false);
  const [vpnRegion, setVpnRegion] = useState<string>("usa");
  const [showVpnModal, setShowVpnModal] = useState<boolean>(false);

  // Music player state
  const [showMusicPlayer, setShowMusicPlayer] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0); // 0-100
  const playerRef = useRef<any>(null);

  const { toast } = useToast();
  const currentTab = tabs.find((t) => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs((tabs) => tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const validateAndFormatUrl = (input: string) => {
    let formattedUrl = input.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    return formattedUrl;
  };

  const loadUrlForTab = async (tabId: string, targetUrl: string) => {
    const formattedUrl = validateAndFormatUrl(targetUrl);
    updateTab(tabId, { isLoading: true, error: null });
    try {
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
        const title = new URL(formattedUrl).hostname || "New Tab";
        return prevTabs.map((t) =>
          t.id === tabId
            ? { ...t, currentUrl: formattedUrl, displayUrl: formattedUrl, proxyContent: data, history: newHistory, historyIndex: newHistory.length - 1, isLoading: false, title }
            : t
        );
      });

      toast({ title: "Success!", description: "Website loaded through proxy" });
    } catch (e) {
      console.error("Error loading URL:", e);
      updateTab(tabId, { error: "Failed to load website through proxy.", isLoading: false });
    }
  };

  useEffect(() => {
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab?.url) loadUrlForTab(activeTab, currentTab.url);
  };

  const toggleMusicPlayer = () => {
    setShowMusicPlayer((prev) => !prev);
    if (!isPlaying) setIsPlaying(true);
  };

  const skipNext = () => setCurrentSongIndex((i) => (i + 1) % PLAYLIST.length);
  const skipPrev = () => setCurrentSongIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length);

  // YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: PLAYLIST[currentSongIndex].videoId,
        playerVars: { autoplay: 1, loop: 1, playlist: PLAYLIST.map(s => s.videoId).join(",") },
        events: {
          onReady: (event: any) => {
            if (isPlaying) event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) skipNext();
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.loadVideoById(PLAYLIST[currentSongIndex].videoId);
      if (isPlaying) playerRef.current.playVideo();
    }
  }, [currentSongIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        if (duration) setProgress((currentTime / duration) * 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentCountry = COUNTRIES.find((c) => c.code === vpnRegion);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Tabs & Chrome */}
      {!isFullScreen && (
        <div className="glass-morphism border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-2">
              <TabsList className="flex gap-1 bg-transparent p-0">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    <span className="truncate">{tab.title}</span>
                    {tabs.length > 1 && <button onClick={(e) => { e.stopPropagation(); setTabs(tabs.filter(t => t.id !== tab.id)); }}><X /></button>}
                  </TabsTrigger>
                ))}
                <Button onClick={() => setTabs([...tabs, { ...initialTab, id: `tab-${Date.now()}` }])}><Plus /></Button>
              </TabsList>
              <Button onClick={() => setIsFullScreen(!isFullScreen)}>{isFullScreen ? <Minimize /> : <Maximize />}</Button>
            </div>
          </Tabs>
        </div>
      )}

      {/* Address Bar */}
      <div className="glass-morphism border-b flex items-center gap-2 p-3">
        <div className="flex gap-1">
          <Button onClick={() => {}}><ArrowLeft /></Button>
          <Button onClick={() => {}}><ArrowRight /></Button>
          <Button onClick={() => {}}><RotateCw /></Button>
          <Button onClick={() => {}}><Home /></Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex gap-2 items-center">
          <div className="flex-1 relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={currentTab?.url || ""} onChange={(e) => updateTab(activeTab, { url: e.target.value })} placeholder="Enter website URL" />
          </div>

          <Button type="button" onClick={() => setShowMathSolver(!showMathSolver)}><Calculator /></Button>

          {/* Boombox Music Toggle */}
          <Button type="button" onClick={toggleMusicPlayer}><Boombox /></Button>
        </form>
      </div>

      {/* Music Player */}
      {showMusicPlayer && (
        <div className="absolute bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg w-80 flex flex-col gap-2">
          <h3 className="font-bold">Navis Radio</h3>
          <p className="text-sm font-medium">{PLAYLIST[currentSongIndex].title} - {PLAYLIST[currentSongIndex].artist}</p>
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
