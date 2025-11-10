import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";

interface MathSolverProps {
  onClose: () => void;
}

export const MathSolver = ({ onClose }: MathSolverProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string>("");
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const startSelection = () => {
    setIsSelecting(true);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSolution("");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    setSelectionStart({ x: e.clientX, y: e.clientY });
    setSelectionEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;
    setSelectionEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async () => {
    if (!isSelecting || !selectionStart || !selectionEnd) return;

    setIsSelecting(false);
    setIsLoading(true);

    try {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Temporarily hide the selection overlay
      if (overlayRef.current) overlayRef.current.style.display = "none";

      const canvas = await html2canvas(document.body, {
        x: x + scrollX,
        y: y + scrollY,
        width,
        height,
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: "#fff", // ensure math is visible
      });

      // Restore overlay
      if (overlayRef.current) overlayRef.current.style.display = "";

      const imageData = canvas.toDataURL("image/png");

      const { data, error } = await supabase.functions.invoke("solve-math", {
        body: { image: imageData },
      });

      if (error) throw error;

      setSolution(data.solution);
      toast({
        title: "Math problem solved!",
        description: "See the solution below",
      });
    } catch (error) {
      console.error("Error solving math:", error);
      toast({
        title: "Error",
        description: "Failed to solve the math problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const getSelectionStyle = () => {
    if (!selectionStart || !selectionEnd) return {};

    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    return {
      position: "fixed" as const,
      left: x,
      top: y,
      width,
      height,
      border: "3px solid hsl(var(--primary))",
      backgroundColor: "rgba(255, 255, 255, 0.4)",
      boxShadow: "0 0 0 9999px rgba(255, 255, 255, 0.2)",
      pointerEvents: "none" as const,
      zIndex: 9999,
    };
  };

  return (
    <>
      {/* Selection overlay */}
      {isSelecting && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9998] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
        >
          {selectionStart && selectionEnd && <div style={getSelectionStyle()} />}
        </div>
      )}

      {/* Math Solver Panel */}
      <div className="fixed right-4 top-20 z-50 w-96 glass-morphism rounded-lg shadow-xl border border-border animate-fade-in">
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
          <Button
            onClick={startSelection}
            disabled={isSelecting || isLoading}
            className="w-full"
          >
            {isSelecting ? (
              "Select area on screen..."
            ) : (
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
              Click the button above to screenshot a math problem and get an AI-powered solution
            </div>
          )}
        </div>
      </div>
    </>
  );
};
