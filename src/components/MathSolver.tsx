import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import Tesseract from "tesseract.js"; // OCR to read text from screenshot
import { evaluate, parse } from "mathjs";

export default function LocalMathSolver() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [selectionRect, setSelectionRect] = useState(null);
  const [startPoint, setStartPoint] = useState(null);

  const startSelection = () => {
    setIsSelecting(true);
    setSolution("");
    setSelectionRect(null);
    setStartPoint(null);
  };

  const handleMouseDown = (e) => {
    if (!isSelecting) return;
    setStartPoint({ x: e.clientX, y: e.clientY });
    setSelectionRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
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
      // Take screenshot of selected area
      const canvas = await html2canvas(document.body, {
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        useCORS: true,
        allowTaint: true,
      });

      // Use OCR to read text from screenshot
      const { data } = await Tesseract.recognize(canvas, "eng", { logger: m => console.log(m) });
      const problemText = data.text.replace(/\n/g, "").trim();
      console.log("Detected Problem:", problemText);

      // Solve using math.js
      let result;
      try {
        result = evaluate(problemText);
      } catch {
        result = "Could not solve automatically. Try simpler format.";
      }

      setSolution(`Problem: ${problemText}\nSolution: ${result}`);
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
          position: "fixed",
          left: selectionRect.x,
          top: selectionRect.y,
          width: selectionRect.width,
          height: selectionRect.height,
          border: "3px solid #4f46e5",
          backgroundColor: "rgba(255,255,255,0.3)",
          pointerEvents: "none",
          zIndex: 9999,
        }
      : {};

  return (
    <>
      {/* Screenshot selection overlay */}
      {isSelecting && (
        <div
          className="fixed inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ backgroundColor: "rgba(0,0,0,0.35)", zIndex: 9998 }}
        >
          {selectionRect && <div style={overlayStyle} />}
        </div>
      )}

      {/* Panel */}
      <div
        className="fixed right-4 top-20 w-96 p-4 rounded-xl shadow-xl"
        style={{ background: "#1e1e1e", color: "white", zIndex: 2000 }}
      >
        <h2 className="text-lg font-bold mb-3">Local Math Solver</h2>

        <button
          onClick={startSelection}
          disabled={isSelecting || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2"
        >
          {isSelecting ? "Select the math problem..." : "Screenshot & Solve"}
        </button>

        {isLoading && (
          <div className="text-center text-gray-300 py-6">Solving...</div>
        )}

        {!isLoading && solution && (
          <div className="bg-black/30 p-3 rounded-lg mt-4 max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">
            {solution}
          </div>
        )}

        {!isLoading && !solution && (
          <div className="text-gray-400 text-center text-sm py-6">
            Screenshot a math problem to get an instant solution.
          </div>
        )}
      </div>
    </>
  );
}
