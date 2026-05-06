"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  frameBase64: string;
  onConfirm: (corners: number[][]) => void;
  onCancel: () => void;
}

const COLORS = ["#f43f5e", "#f97316", "#22c55e", "#3b82f6"];
const LABELS = ["1", "2", "3", "4"];

export default function TableCornerPicker({ frameBase64, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // corners in canvas-space
  const [corners, setCorners] = useState<number[][]>([]);
  // natural image size
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  // canvas display size
  const [canvasSize, setCanvasSize] = useState({ w: 640, h: 360 });
  const draggingIdx = useRef<number | null>(null);

  // ── Load image & set canvas size ─────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });

      // Fit to screen — leave space for header (60px)
      const maxW = window.innerWidth;
      const maxH = window.innerHeight - 60;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const screenRatio = maxW / maxH;

      let w, h;
      if (imgRatio > screenRatio) {
        // wider — fit width
        w = maxW;
        h = Math.round(w / imgRatio);
      } else {
        // taller — fit height
        h = maxH;
        w = Math.round(h * imgRatio);
      }

      setCanvasSize({ w, h });

      // Default 4 corners at 10% inset
      setCorners([
        [Math.round(w * 0.1), Math.round(h * 0.1)],
        [Math.round(w * 0.9), Math.round(h * 0.1)],
        [Math.round(w * 0.9), Math.round(h * 0.9)],
        [Math.round(w * 0.1), Math.round(h * 0.9)],
      ]);
    };
    img.src = frameBase64;
  }, [frameBase64]);

  // ── Draw canvas ───────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (corners.length < 2) return;

    // Draw polygon
    ctx.beginPath();
    ctx.moveTo(corners[0][0], corners[0][1]);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i][0], corners[i][1]);
    if (corners.length === 4) ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw points
    corners.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[i] ?? "#fff";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(LABELS[i] ?? String(i + 1), x, y);
    });
  }, [corners]);

  useEffect(() => {
    draw();
  }, [draw, canvasSize]);

  // ── Mouse / touch helpers ─────────────────────────────────────────────────
  function getPos(e: React.MouseEvent | React.TouchEvent): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      return [(t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY];
    }
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
  }

  function findNearest(x: number, y: number): number | null {
    let best = -1;
    let bestDist = 20; // px threshold
    corners.forEach(([cx, cy], i) => {
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best === -1 ? null : best;
  }

  function onPointerDown(e: React.MouseEvent | React.TouchEvent) {
    const [x, y] = getPos(e);
    const idx = findNearest(x, y);
    if (idx !== null) {
      draggingIdx.current = idx;
    }
  }

  function onPointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (draggingIdx.current === null) return;
    const [x, y] = getPos(e);
    const canvas = canvasRef.current!;
    const cx = Math.max(0, Math.min(canvas.width, x));
    const cy = Math.max(0, Math.min(canvas.height, y));
    setCorners((prev) => prev.map((c, i) => (i === draggingIdx.current ? [Math.round(cx), Math.round(cy)] : c)));
  }

  function onPointerUp() {
    draggingIdx.current = null;
  }

  // ── Convert canvas coords → original image coords ─────────────────────────
  function toImageCoords(canvasCorners: number[][]): number[][] {
    const scaleX = imgSize.w / canvasSize.w;
    const scaleY = imgSize.h / canvasSize.h;
    return canvasCorners.map(([x, y]) => [Math.round(x * scaleX), Math.round(y * scaleY)]);
  }

  function handleConfirm() {
    onConfirm(toImageCoords(corners));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="shrink-0 px-5 py-3 border-b border-white/10 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Xác định góc bàn</h3>
            <p className="text-xs text-blue-300 mt-0.5">Kéo 4 điểm vào đúng 4 góc mặt bàn billiard</p>
          </div>
          {/* Legend inline */}
          <div className="hidden sm:flex gap-3 ml-4">
            {LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
                Góc {label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/60
              hover:text-white hover:border-white/20 transition"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={corners.length < 4}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-sm font-bold text-white
              transition shadow-lg shadow-blue-500/20 disabled:opacity-40"
          >
            Xác nhận góc bàn
          </button>
        </div>
      </div>

      {/* Canvas — fills remaining screen */}
      <div
        ref={containerRef}
        className="flex-1 w-full bg-black flex items-center justify-center overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            cursor: "crosshair",
            touchAction: "none",
          }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>
    </div>
  );
}
