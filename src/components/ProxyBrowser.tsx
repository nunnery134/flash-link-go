import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import Tesseract from "tesseract.js";
import { evaluate } from "mathjs";

interface MathSolverProps {
  onClose: () => void;
}

const MathSolver: React.FC<MathSolverProps> = ({ onClose }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import Tesseract from "tesseract.js";
import { evaluate } from "mathjs";

interface MathSolverProps {
  onClose: () => void;
}

export const MathSolver: React.FC<MathSolverProps> = ({ onClose }) => {
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
        result = "Could not solve automatically.";
      }

      setSolution(`Problem: ${problem}\nSolution: ${result}`);
    } catch (err) {
      setSolution("Error reading or solving the problem.");
    }

    setSelectionRect(null);
    setStartPoint(null);
    setIsLoading(false);
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
            <DialogTitle>Math Screenshot Solver</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button onClick={startSelection} disabled={isSelecting || isLoading}>
              {isSelecting ? "Select the math problem..." : "Screenshot & Solve"}
            </Button>

            {isLoading && <p>Solving...</p>}
            {solution && <pre className="bg-background/30 p-3 rounded-lg whitespace-pre-wrap">{solution}</pre>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
null);
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
      // Screenshot selected area
      const canvas = await html2canvas(document.body, {
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        useCORS: true,
        allowTaint: true,
      });

      // OCR to extract text
      const { data } = await Tesseract.recognize(canvas, "eng");
      const problem = data.text.replace(/\n/g, "").trim();
      console.log("Detected problem:", problem);

      // Evaluate with mathjs
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

export default MathSolver;
