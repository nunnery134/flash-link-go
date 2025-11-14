import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MathSolverProps {
  onClose: () => void;
}

export const MathSolver = ({ onClose }: MathSolverProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string>("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const { toast } = useToast();

  // Begin selection
  const startSelection = () => {
    setIsSelecting(true);
    setRect(null);
    setStartPoint(null);
    setSolution("");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    setStartPoint({ x: e.clientX, y: e.clientY });
    setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPoint) return;

    const x = Math.min(startPoint.x, e.clientX);
    const y = Math.min(startPoint.y, e.clientY);
    const width = Math.abs(e.clientX - startPoint.x);
    const height = Math.abs(e.clientY - startPoint.y);

    setRect({ x, y, width, height });
  };

  const handleMouseUp = async () => {
    if (!rect) return;

    setIsSelecting(false);
    setIsLoading(true);

    try {
      // Permission prompt — user chooses screen/window to capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 }
      });

      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);

      const frame = await imageCapture.grabFrame();

      // Canvas for cropped screenshot
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * 2; // high resolution
      canvas.height = rect.height * 2;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas error");

      ctx.drawImage(
        frame,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const image = canvas.toDataURL("image/png");

      track.stop(); // stop recording immediately

      // Send to Supabase function
      const { data, error } = await supabase.functions.invoke("solve-math", {
        body: { image }
      });

      if (error) throw error;

      setSolution(data.solution);
      toast({ title: "Math problem solved!", description: "Scroll down to view solution." });

    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to capture or solve. Try again.",
        variant: "destructive",
      });

    } finally {
      setIsLoading(false);
      setRect(null);
      setStartPoint(null);
    }
  };

  const getRectStyle = () => {
    if (!rect) return {};
    return {
      position: "fixed" as const,
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      background: "rgba(255,255,255,0.25)",
      border: "3px solid hsl(var(--primary))",
      pointerEvents: "none" as const,
      zIndex: 99999
    };
  };

  return (
    <>
      {/* Selection overlay */}
      {isSelecting && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[99998] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            backgroundColor: "rgba(0,0,0,0.6)" // darken everything except rectangle
          }}
        >
          {rect && <div style={getRectStyle()} />}
        </div>
      )}

      {/* Panel */}
      <div className="fixed right-4 top-20 z-50 w-96 glass-morphism rounded-lg shadow-xl border border-border math-solver-panel">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Math AI Solver</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Button onClick={startSelection} disabled={isSelecting || isLoading} className="w-full">
            {isSelecting ? "Select area..." : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Screenshot & Solve
              </>
            )}
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {solution && (
            <div className="bg-background/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Solution:</h3>
              <div className="whitespace-pre-wrap text-sm">{solution}</div>
            </div>
          )}

          {!solution && !isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Click the button above to screenshot a math problem and get an AI-powered solution.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
