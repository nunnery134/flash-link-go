import { useState, useRef, useEffect, useCallback } from "react";
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
  Star,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import Tesseract from "tesseract.js";
import { evaluate } from "mathjs";

// ------------------- Math Solver -------------------
interface MathSolverProps {
  onClose: () => void;
}

const MathSolver: React.FC<MathSolverProps> = ({ onClose }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [solution, setSolution] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const startSelection = () => {
    setIsSelecting(true);
    setSolution("");
    setSelectionRect(null);
    setStartPoint(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    setStartPoint({ x: e.clientX, y: e.clientY });
    setSelectionRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPoint) return;
    const x = Math.min(startPoint.x, e.clientX);
    const y = Math.min(startPoint.y, e.clientY);
    const width = Math.abs(e.clientX - startPoint.x);
    const height = Math.abs(e.clientY - startPoint.y);
    setSelectionRect({ x, y, width, height });
  };

  const handleMouseUp = async () => {
    if (!selectionRect) return;
    setIsSelecting(false);
    setIsLoading(true);

    try {
      const canvas = await html2canvas(document.body, {
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        useCORS: true,
        allowTaint: true,
      });

      const { data } = await Tesseract.recognize(canvas, "eng");
      const problem = data.text.replace(/\n/g, "").trim();

      let result;
      try {
        result = evaluate(problem);
      } catch {
        result = "Could not solve automatically. Try a simpler format.";
      }

      setSolution(`Problem: ${problem}\nSolution: ${result}`);
    } catch (err) {
      console.error(err);
      setSolution("Error reading or solving the problem.");
    }

    setIsLoading(false);
    setSelectionRect(null);
    setStartPoint(null);
  };

  const overlayStyle =
    selectionRect && isSelecting
      ? {
          position: "fixed" as const,
          left: selectionRect.x,
          top: selectionRect.y,
          width: selectionRect.width,
          height: selectionRect.height,
          border: "2px solid #4f46e5",
          backgroundColor: "rgba(255,255,255,0.3)",
          pointerEvents: "none" as const,
          zIndex: 9999,
        }
      : {};

  return (
    <>
      {isSelecting && (
        <div
          className="fixed inset-0 cursor-crosshair"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", zIndex: 9998 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {selectionRect && <div style={overlayStyle} />}
        </div>
      )}

      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Math Solver</DialogTitle>
            <DialogDescription>
              Click the button below, select the math problem on your screen, and get an instant solution.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button onClick={startSelection} disabled={isSelecting || isLoading}>
              {isSelecting ? "Select the math problem..." : "Screenshot & Solve"}
            </Button>

            {isLoading && <p className="text-sm text-muted-foreground">Solving...</p>}

            {solution && (
              <pre className="bg-background/30 p-3 rounded-lg whitespace-pre-wrap text-sm">{solution}</pre>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ------------------- Navis Radio -------------------
const songs = [
  { title: "The Mind Electric", artist: "Miracle Musical", url: "https://www.youtube.com/embed/tZtCYqPVSp8?autoplay=1", duration: 242 },
  { title: "Oblivion", artist: "Grimes", url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1", duration: 250 },
  { title: "Paprika Theme", artist: "Susumu Hirasawa", url: "https://www.youtube.com/embed/fCeiUX59_FM?autoplay=1", duration: 215 },
  { title: "Repeat Mix", artist: "Various Artists", url: "https://www.youtube.com/embed/99H578iry8s?autoplay=1&list=RD99H578iry8s", duration: 240 },
];

const NavisRadio = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (isPlaying && !isMinimized) {
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
  }, [isPlaying, currentIndex, isMinimized]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => { setCurrentIndex((prev) => (prev + 1) % songs.length); setProgress(0); };
  const handlePrev = () => { setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length); setProgress(0); };
  const toggleMinimize = () => { setIsMinimized(!isMinimized); if (!isMinimized && isPlaying && iframeRef.current) iframeRef.current.src = ""; };

  useEffect(() => {
    if (iframeRef.current) iframeRef.current.src = isPlaying && !isMinimized ? currentSong.url : "";
  }, [isPlaying, currentIndex, isMinimized, currentSong.url]);

  return (
    <div className={`fixed bottom-4 left-4 glass-morphism p-4 rounded-xl shadow-lg border border-border z-50 transition-all duration-300 ${isMinimized ? "w-20" : "w-64"}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-primary">{isMinimized ? "🎵" : "🎵 Navis Radio"}</h2>
        <Button variant="ghost" size="icon" onClick={toggleMinimize} className="h-6 w-6">
          {isMinimized ? <Maximize className="h-3 w-3" /> : <Minimize className="h-3 w-3" />}
        </Button>
      </div>

      {!isMinimized && (
        <>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={handlePrev}><SkipBack className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handlePlayPause}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
            <Button variant="ghost" size="icon" onClick={handleNext}><SkipForward className="h-4 w-4" /></Button>
          </div>

          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div className="h-2 bg-primary transition-all duration-200" style={{ width: `${(progress / currentSong.duration) * 100}%` }} />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium truncate">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground">{currentSong.artist}</p>
          </div>
        </>
      )}

      <iframe ref={iframeRef} className="hidden" allow="autoplay" title="Navis Radio" />
    </div>
  );
};

// ------------------- Main Proxy Browser -------------------
interface TabState { id: string; url: string; currentUrl: string; displayUrl: string; isLoading: boolean; error: string | null; history: string[]; historyIndex: number; proxyContent: string; title: string; }
interface Bookmark { id: string; title: string; url: string; }

export const ProxyBrowser = () => {
  const initialTab: TabState = { id: "tab-1", url: "", currentUrl: "", displayUrl: "", isLoading: false, error: null, history: [], historyIndex: -1, proxyContent: "", title: "New Tab" };
  const [tabs, setTabs] = useState<TabState[]>([initialTab]);
  const [activeTab, setActiveTab] = useState<string>("tab-1");
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [escPressCount, setEscPressCount] = useState<number>(0);
  const escTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const currentTab = tabs.find((t) => t.id === activeTab);

  const updateTab = useCallback((id: string, updates: Partial<TabState>) => {
    setTabs((prevTabs) => prevTabs.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const validateAndFormatUrl = useCallback((input: string): string => {
    let formattedUrl = input.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) formattedUrl = "https://" + formattedUrl;
    return formattedUrl;
  }, []);

  const loadUrlForTab = useCallback(async (tabId: string, targetUrl: string) => {
    const formattedUrl = validateAndFormatUrl(targetUrl);
    updateTab(tabId, { isLoading: true, error: null });
    try {
      new URL(formattedUrl);
      const { data, error: proxyError } = await supabase.functions.invoke("proxy", { body: { url: formattedUrl } });
      if (proxyError) throw new Error(proxyError.message);
      setTabs((prevTabs) => {
        const tab = prevTabs.find((t) => t.id === tabId);
        if (!tab) return prevTabs;
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(formattedUrl);
        let title = "New Tab";
        try { const urlObj = new URL(formattedUrl); title = urlObj.hostname || "New Tab"; } catch {}
        return prevTabs.map((t) => t.id === tabId ? { ...t, currentUrl: formattedUrl, displayUrl: formattedUrl, proxyContent: data, history: newHistory, historyIndex: newHistory.length - 1, isLoading: false, title } : t);
      });
      toast({ title: "Success!", description: "Website loaded through proxy" });
    } catch (e: any) {
      console.error("Error loading URL:", e);
      updateTab(tabId, { error: `Failed to load website: ${e.message || "Site may be down."}`, isLoading: false });
      toast({ title: "Error", description: `Failed to load: ${e.message || "Check URL."}`, variant: "destructive" });
    }
  }, [updateTab, validateAndFormatUrl, toast]);

  useEffect(() => { loadUrlForTab("tab-1", initialTab.url); }, [loadUrlForTab, initialTab.url]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Tabs Bar & Browser Controls omitted for brevity */}
      {/* You can insert the same Tabs / URL input UI here */}
      {showMathSolver && <MathSolver onClose={() => setShowMathSolver(false)} />}
      <NavisRadio />
    </div>
  );
};
