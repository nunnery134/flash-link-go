import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MathSolverProps {
  onClose: () => void;
}

export const MathSolver = ({ onClose }: MathSolverProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string>("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const { toast } = useToast();

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
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(document.body, {
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        useCORS: true,
        allowTaint: true,
      });

      const imageData = canvas.toDataURL("image/png").split(",")[1]; // base64 only

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
          import.meta.env.VITE_GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: "Solve the math problem shown in this screenshot. Explain step-by-step." },
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: imageData,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const json = await response.json();
      const aiText = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No solution found.";

      setSolution(aiText);
      toast({ title: "Solved!", description: "AI generated a solution." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to capture or solve using Gemini.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setSelectionRect(null);
      setStartPoint(null);
    }
  };

  const getSelectionStyle = () => {
    if (!selectionRect) return {};
    return {
      position: "fixed" as const,
      left: selectionRect.x,
      top: selectionRect.y,
      width: selectionRect.width,
      height: selectionRect.height,
      border: "3px solid hsl(var(--primary))",
      backgroundColor: "rgba(255,255,255,0.3)",
      pointerEvents: "none" as const,
      zIndex: 9999,
    };
  };

  return (
    <>
      {isSelecting && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9998] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          {selectionRect && <div style={getSelectionStyle()} />}
        </div>
      )}

      <div className="fixed right-4 top-20 z-50 w-96 glass-morphism rounded-lg shadow-xl border border-border animate-fade-in math-solver-panel">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Math AI Solver (Gemini)</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Button onClick={startSelection} disabled={isSelecting || isLoading} className="w-full">
            {isSelecting ? "Select area on screen..." : <>
              <Camera className="h-4 w-4 mr-2" />
              Screenshot & Solve
            </>}
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
              Click the button above to screenshot a math problem and get an AI solution from Gemini.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
