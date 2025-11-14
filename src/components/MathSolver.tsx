import { useState, useRef } from "react";
import html2canvas from "html2canvas";

export default function MathSolver() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const overlayRef = useRef(null);
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
      const canvas = await html2canvas(document.body, {
        x: selectionRect.x,
        y: selectionRect.y,
        width: selectionRect.width,
        height: selectionRect.height,
        useCORS: true,
        allowTaint: true,
      });

      const base64 = canvas.toDataURL("image/png").split(",")[1];

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_API_KEY_HERE",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: "Solve this math problem. Explain step-by-step." },
                  {
                    inlineData: {
                      mimeType: "image/png",
                      data: base64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "No solution found.";
      setSolution(text);

    } catch (e) {
      console.error("Error:", e);
      setSolution("Error solving the problem");
    }

    setIsLoading(false);
    setSelectionRect(null);
    setStartPoint(null);
  };

  const selectionStyle = selectionRect
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
      {isSelecting && (
        <div
          ref={overlayRef}
          className="fixed inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ backgroundColor: "rgba(0,0,0,0.35)", zIndex: 9998 }}
        >
          {selectionRect && <div style={selectionStyle} />}
        </div>
      )}

      <div
        className="fixed right-4 top-20 w-96 rounded-xl shadow-xl p-4"
        style={{ background: "#1e1e1e", color: "white", zIndex: 2000 }}
      >
        <h2 className="text-lg font-bold mb-3">Math Solver (Gemini)</h2>

        <button
          onClick={startSelection}
          disabled={isSelecting || isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 mb-4"
        >
          {isSelecting ? "Select area..." : "Screenshot & Solve"}
        </button>

        {isLoading && (
          <div className="text-center py-6 text-gray-300">Solving...</div>
        )}

        {!isLoading && solution && (
          <div className="bg-black/30 p-3 rounded-lg max-h-80 overflow-y-auto text-sm whitespace-pre-wrap">
            {solution}
          </div>
        )}

        {!isLoading && !solution && (
          <div className="text-center text-gray-400 text-sm py-6">
            Click the button and select a math problem.
          </div>
        )}
      </div>
    </>
  );
}
