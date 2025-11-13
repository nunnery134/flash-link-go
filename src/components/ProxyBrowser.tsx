import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, RotateCw, Home, Shield, AlertCircle, Loader2, Plus, X, Play, Pause, Volume2, Calculator, Star, Maximize, Minimize, SkipForward, SkipBack } from "lucide-react";
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
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

const songs = [
  {
    title: "The Mind Electric",
    artist: "Miracle Musical",
    url: "https://www.youtube.com/embed/tZtCYqPVSp8?autoplay=1",
    duration: 242, // seconds
  },
  {
    title: "Oblivion",
    artist: "Grimes",
    url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1",
    duration: 250,
  },
  {
    title: "Paprika Theme",
    artist: "Susumu Hirasawa",
    url: "https://www.youtube.com/embed/fCeiUX59_FM?autoplay=1",
    duration: 215,
  },
  {
    title: "Repeat Mix",
    artist: "Various Artists",
    url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1&list=RD99H578iry8s",
    duration: 240,
  },
];

const NavisRadio = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false); // Add minimize state
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (isPlaying) {
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= currentSong.duration) {
            handleNext();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying, currentIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setProgress(0);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    if (iframeRef.current) {
      // Pause audio when minimized
      iframeRef.current.src = isPlaying && !isMinimized ? currentSong.url : "";
    }
  }, [isPlaying, currentIndex, isMinimized]);

  return (
    // Conditionally apply classes based on minimize state
    <div className={`fixed bottom-4 left-4 glass-morphism p-4 rounded-xl shadow-lg border border-border z-50 transition-all duration-300 ${isMinimized ? 'w-20' : 'w-64'}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-primary">{isMinimized ? '🎵' : '🎵 Navis Radio'}</h2>
        <Button variant="ghost" size="icon" onClick={toggleMinimize} className="h-6 w-6">
          {isMinimized ? <Maximize className="h-3 w-3" /> : <Minimize className="h-3 w-3" />}
        </Button>
      </div>
      
      {!isMinimized && (
        <>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={handlePrev}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="h-2 bg-primary transition-all duration-200"
              style={{ width: `${(progress / currentSong.duration) * 100}%` }}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium truncate">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground">{currentSong.artist}</p>
          </div>
        </>
      )}

      <iframe
        ref={iframeRef}
        className="hidden"
        allow="autoplay"
        title="Navis Radio"
      />
    </div>
  );
};

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
    title: "New Tab"
  };
  
  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [escPressCount, setEscPressCount] = useState<number>(0);
  const escTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    setTabs(prevTabs => prevTabs.map(t => 
      t.id === tabId ? { ...t, isLoading: true, error: null } : t
    ));
    
    try {
      new URL(formattedUrl);
      const { data, error: proxyError } = await supabase.functions.invoke('proxy', {
        body: { url: formattedUrl }
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }

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
      setTabs(prevTabs => prevTabs.map(t => 
        t.id === tabId ? { 
          ...t,
          error: "Failed to load website. The site may be down or blocking proxy access.",
          isLoading: false 
        } : t
      ));
    }
  };

  useEffect(() => {
    loadUrlForTab("tab-1", "https://navis-proxy-v4.vercel.app/search.html");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTab || !currentTab.url) return;
    
    // Check if it's a search query or URL
    const input = currentTab.url.trim();
    const isUrl = input.includes('.') && !input.includes(' ');
    
    if (isUrl) {
      // It's a URL, load it directly
      loadUrlForTab(activeTab, input);
    } else {
      // It's a search query, use Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
      loadUrlForTab(activeTab, searchUrl);
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

  // Rest of the ProxyBrowser component...
  // You will need to render the NavisRadio component within the ProxyBrowser
  // or a parent component for it to appear on the page.
  
  return (
    // ... JSX content of ProxyBrowser ...
    <div className="flex flex-col h-screen">
      {/* ... browser UI elements ... */}
      <NavisRadio /> {/* Render the component */}
    </div>
  );
};
