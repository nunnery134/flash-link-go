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
  Plus,
  X,
  Play,
  Pause,
  Maximize,
  Minimize,
  Star,
  MapPin,
  Power,
  Music
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  { code: "usa", label: "USA", flag: "🇺🇸" },
  { code: "uk", label: "UK", flag: "🇬🇧" },
  { code: "japan", label: "Japan", flag: "🇯🇵" },
  { code: "canada", label: "Canada", flag: "🇨🇦" },
  { code: "germany", label: "Germany", flag: "🇩🇪" },
];

export const ProxyBrowser = () => {
  const initialTab: TabState = {
    id: `tab-1`,
    url: "https://web.cloudmoonapp.com/",
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
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // VPN
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [vpnRegion, setVpnRegion] = useState("usa");
  const [showVpnModal, setShowVpnModal] = useState(false);

  // Radio
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  const tracks = [
    {
      title: "Track 1",
      artist: "Artist 1",
      url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1",
    },
    // Add more tracks from your playlist if needed
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);

  const updateTab = (id: string, updates: Partial<TabState>) => {
    setTabs((tabs) => tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const loadUrlForTab = async (tabId: string, targetUrl: string) => {
    const formattedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
    updateTab(tabId, { isLoading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke("proxy", {
        body: { url: formattedUrl, region: vpnEnabled ? vpnRegion : undefined },
      });
      if (error) throw new Error(error.message);

      updateTab(tabId, {
        currentUrl: formattedUrl,
        displayUrl: formattedUrl,
        proxyContent: data,
        history: [...(currentTab?.history.slice(0, currentTab?.historyIndex + 1) || []), formattedUrl],
        historyIndex: (currentTab?.historyIndex || 0) + 1,
        isLoading: false,
        title: new URL(formattedUrl).hostname,
      });
    } catch (err) {
      updateTab(tabId, {
        isLoading: false,
        error: "Failed to load site via proxy",
      });
    }
  };

  useEffect(() => {
    loadUrlForTab("tab-1", "https://web.cloudmoonapp.com/");
  }, []);

  const toggleRadio = () => setIsRadioOpen(!isRadioOpen);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipTrack = () => {
    const next = (currentTrack + 1) % tracks.length;
    setCurrentTrack(next);
    if (audioRef.current) audioRef.current.src = tracks[next].url;
    setIsPlaying(true);
    audioRef.current?.play();
  };

  const rewindTrack = () => {
    const prev = (currentTrack - 1 + tracks.length) % tracks.length;
    setCurrentTrack(prev);
    if (audioRef.current) audioRef.current.src = tracks[prev].url;
    setIsPlaying(true);
    audioRef.current?.play();
  };

  return (
    <div className="flex flex-col h-screen bg-background text-white">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1">
              {tab.title}
              {tabs.length > 1 && <X onClick={(e) => { e.stopPropagation(); setTabs(tabs.filter(t => t.id !== tab.id)); }} />}
            </TabsTrigger>
          ))}
          <Button onClick={() => {
            const newTab = { ...initialTab, id: `tab-${Date.now()}` };
            setTabs([...tabs, newTab]);
            setActiveTab(newTab.id);
          }}>+</Button>
        </TabsList>
      </Tabs>

      {/* Navigation + Address Bar */}
      <div className="flex items-center gap-2 p-2 bg-card">
        <Button onClick={() => {
          if (currentTab?.historyIndex! > 0) {
            const prevUrl = currentTab?.history[currentTab.historyIndex - 1];
            updateTab(activeTab, { historyIndex: currentTab!.historyIndex - 1 });
            loadUrlForTab(activeTab, prevUrl!);
          }
        }}><ArrowLeft /></Button>

        <Button onClick={() => {
          if (currentTab?.historyIndex! < currentTab?.history.length! - 1) {
            const nextUrl = currentTab?.history[currentTab.historyIndex + 1];
            updateTab(activeTab, { historyIndex: currentTab!.historyIndex + 1 });
            loadUrlForTab(activeTab, nextUrl!);
          }
        }}><ArrowRight /></Button>

        <Button onClick={() => loadUrlForTab(activeTab, currentTab!.currentUrl!)}><RotateCw /></Button>
        <Button onClick={() => updateTab(activeTab, { url: "", currentUrl: "", proxyContent: "", history: [], historyIndex: -1 })}><Home /></Button>

        <Input type="text" value={currentTab?.url} onChange={(e) => updateTab(activeTab, { url: e.target.value })} placeholder="Enter URL" className="flex-1" />
        <Button onClick={() => loadUrlForTab(activeTab, currentTab!.url!)}><Music /></Button>
        <Button onClick={() => setShowVpnModal(!showVpnModal)}><Shield /></Button>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative">
        {currentTab?.error && <div className="absolute bg-red-600 p-2">{currentTab.error}</div>}
        {currentTab?.isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">Loading...</div>
        ) : (
          <iframe srcDoc={currentTab?.proxyContent} className="w-full h-full" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
        )}
      </div>

      {/* Bookmarks */}
      <div className="flex gap-2 p-2 bg-card">
        <Button onClick={() => loadUrlForTab(activeTab, "https://web.cloudmoonapp.com/")}>WebMoon</Button>
      </div>

      {/* Radio Player */}
      {isRadioOpen && (
        <div className="absolute bottom-0 left-0 right-0 bg-card p-2 flex flex-col items-center gap-1">
          <div>Navis Radio - {tracks[currentTrack].title} - {tracks[currentTrack].artist}</div>
          <div className="flex gap-2">
            <Button onClick={rewindTrack}>⏮</Button>
            <Button onClick={togglePlay}>{isPlaying ? <Pause /> : <Play />}</Button>
            <Button onClick={skipTrack}>⏭</Button>
          </div>
          <audio ref={audioRef} src={tracks[currentTrack].url} autoPlay={isPlaying}></audio>
        </div>
      )}

      {/* VPN Modal */}
      {showVpnModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-card p-4 rounded">
            <h2>VPN</h2>
            <div className="flex gap-2">
              {COUNTRIES.map(c => (
                <Button key={c.code} onClick={() => setVpnRegion(c.code)}>{c.flag}</Button>
              ))}
            </div>
            <Button onClick={() => setVpnEnabled(!vpnEnabled)}>{vpnEnabled ? "ON" : "OFF"}</Button>
            <Button onClick={() => setShowVpnModal(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};
