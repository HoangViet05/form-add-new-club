"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  frameBase64: string;
  onConfirm: (corners: number[][]) => void;
  onCancel: () => void;
}

const COLORS = ["#f43f5e", "#f97316", "#22c55e", "#3b82f6"];
const LABELS = ["1", "2", "3", "4"];
const HEADER_H = 56; // px — header height

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transform { x: number; y: number; scale: number }

export default function TableCornerPicker({ frameBase64, onConfirm, onCancel }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imgRef      = useRef<HTMLImageElement | null>(null);

  // Natural image size
  const [imgSize, setImgSize]     = useState({ w: 1, h: 1 });
  // Canvas logical size == natural image size (1:1 mapping)
  const [canvasSize, setCanvasSize] = useState({ w: 1920, h: 1080 });

  // Corners in IMAGE coords (natural pixels)
  const [corners, setCorners]     = useState<number[][]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Viewport transform (pan + zoom)
  const [xform, setXform]         = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const xformRef                  = useRef<Transform>({ x: 0, y: 0, scale: 1 });

  // Pointer state for drag / pinch
  const draggingCorner  = useRef<number | null>(null);
  const lastPan         = useRef<{ x: number; y: number } | null>(null);
  const pinchRef        = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const pointers        = useRef<Map<number, { x: number; y: number }>>(new Map());

  // ── Sync xformRef ──────────────────────────────────────────────────────────
  useEffect(() => { xformRef.current = xform; }, [xform]);

  // ── Load image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImgSize({ w, h });
      setCanvasSize({ w, h });

      // Default corners at 10% inset in image coords
      setCorners([
        [Math.round(w * 0.1), Math.round(h * 0.1)],
        [Math.round(w * 0.9), Math.round(h * 0.1)],
        [Math.round(w * 0.9), Math.round(h * 0.9)],
        [Math.round(w * 0.1), Math.round(h * 0.9)],
      ]);

      // Fit-to-screen initial transform
      fitToScreen(w, h);
    };
    img.src = frameBase64;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameBase64]);

  function fitToScreen(w: number, h: number) {
    const vw = window.innerWidth;
    const vh = window.innerHeight - HEADER_H;
    const scale = Math.min(vw / w, vh / h);
    const tx = (vw - w * scale) / 2;
    const ty = (vh - h * scale) / 2;
    const t = { x: tx, y: ty, scale };
    setXform(t);
    xformRef.current = t;
  }

  // ── Draw ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || corners.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Polygon
    if (corners.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i][0], corners[i][1]);
      if (corners.length === 4) ctx.closePath();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = Math.max(2, 3 / xformRef.current.scale);
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Points
    const r = Math.max(10, 14 / xformRef.current.scale);
    corners.forEach(([x, y], i) => {
      const isActive = i === activeIdx;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[i] ?? "#fff";
      ctx.globalAlpha = isActive ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(1.5, 2 / xformRef.current.scale);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(11, 13 / xformRef.current.scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(LABELS[i] ?? String(i + 1), x, y);
    });
  }, [corners, activeIdx]);

  useEffect(() => { draw(); }, [draw, canvasSize]);

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  // Screen → image coords
  function screenToImage(sx: number, sy: number): [number, number] {
    const { x, y, scale } = xformRef.current;
    return [
      Math.round((sx - x) / scale),
      Math.round((sy - y) / scale),
    ];
  }

  function clampToImage(ix: number, iy: number): [number, number] {
    return [
      Math.max(0, Math.min(imgSize.w, ix)),
      Math.max(0, Math.min(imgSize.h, iy)),
    ];
  }

  function findNearestCorner(sx: number, sy: number): number | null {
    const threshold = 28; // screen px
    let best = -1, bestD = threshold;
    corners.forEach(([cx, cy], i) => {
      const { x, y, scale } = xformRef.current;
      const scx = cx * scale + x;
      const scy = cy * scale + y;
      const d = Math.hypot(sx - scx, sy - scy);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best === -1 ? null : best;
  }

  // ── Pointer events ─────────────────────────────────────────────────────────
  function getClientXY(e: React.PointerEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    // canvas CSS size vs logical size ratio
    const cssW = rect.width;
    const cssH = rect.height;
    const logW = canvasSize.w * xformRef.current.scale;
    const logH = canvasSize.h * xformRef.current.scale;
    // We render via CSS transform, so clientX/Y relative to viewport is fine
    return { x: e.clientX, y: e.clientY - HEADER_H };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY - HEADER_H });

    if (pointers.current.size === 2) {
      // Start pinch
      const pts = [...pointers.current.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        cx: (pts[0].x + pts[1].x) / 2,
        cy: (pts[0].y + pts[1].y) / 2,
      };
      draggingCorner.current = null;
      lastPan.current = null;
      return;
    }

    const { x, y } = getClientXY(e);
    const idx = findNearestCorner(x, y);
    if (idx !== null) {
      draggingCorner.current = idx;
      setActiveIdx(idx);
    } else {
      lastPan.current = { x, y };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY - HEADER_H });

    // Pinch zoom
    if (pointers.current.size === 2 && pinchRef.current) {
      const pts = [...pointers.current.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const newDist = Math.hypot(dx, dy);
      const newCx = (pts[0].x + pts[1].x) / 2;
      const newCy = (pts[0].y + pts[1].y) / 2;

      const ratio = newDist / pinchRef.current.dist;
      const { cx, cy } = pinchRef.current;

      setXform(prev => {
        const newScale = Math.max(0.3, Math.min(10, prev.scale * ratio));
        const newX = cx - (cx - prev.x) * (newScale / prev.scale) + (newCx - cx);
        const newY = cy - (cy - prev.y) * (newScale / prev.scale) + (newCy - cy);
        const t = { x: newX, y: newY, scale: newScale };
        xformRef.current = t;
        return t;
      });

      pinchRef.current = { dist: newDist, cx: newCx, cy: newCy };
      return;
    }

    const { x, y } = getClientXY(e);

    // Drag corner
    if (draggingCorner.current !== null) {
      const [ix, iy] = clampToImage(...screenToImage(x, y));
      setCorners(prev => prev.map((c, i) => i === draggingCorner.current ? [ix, iy] : c));
      return;
    }

    // Pan
    if (lastPan.current) {
      const dx = x - lastPan.current.x;
      const dy = y - lastPan.current.y;
      setXform(prev => {
        const t = { ...prev, x: prev.x + dx, y: prev.y + dy };
        xformRef.current = t;
        return t;
      });
      lastPan.current = { x, y };
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    draggingCorner.current = null;
    lastPan.current = null;
    pinchRef.current = null;
    setActiveIdx(null);
  }

  // Mouse wheel zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top - HEADER_H;
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    setXform(prev => {
      const newScale = Math.max(0.3, Math.min(10, prev.scale * delta));
      const newX = mx - (mx - prev.x) * (newScale / prev.scale);
      const newY = my - (my - prev.y) * (newScale / prev.scale);
      const t = { x: newX, y: newY, scale: newScale };
      xformRef.current = t;
      return t;
    });
  }

  function handleConfirm() { onConfirm(corners); }

  const zoomPct = Math.round(xform.scale * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ userSelect: "none" }}>

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 border-b border-white/10 bg-slate-900"
        style={{ height: HEADER_H }}
      >
        {/* Left: title + zoom */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-none">Xác định góc bàn</h3>
            <p className="text-xs text-blue-300 mt-0.5 hidden sm:block">Kéo 4 điểm vào đúng 4 góc mặt bàn</p>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1 py-1 border border-white/10">
            <button
              onClick={() => setXform(p => { const s = Math.max(0.3, p.scale * 0.75); const t = { ...p, scale: s }; xformRef.current = t; return t; })}
              className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition text-base font-bold"
            >−</button>
            <span className="text-xs text-white/70 w-10 text-center tabular-nums">{zoomPct}%</span>
            <button
              onClick={() => setXform(p => { const s = Math.min(10, p.scale * 1.33); const t = { ...p, scale: s }; xformRef.current = t; return t; })}
              className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition text-base font-bold"
            >+</button>
            <button
              onClick={() => fitToScreen(imgSize.w, imgSize.h)}
              className="h-6 px-1.5 flex items-center justify-center rounded text-white/50 hover:text-white hover:bg-white/10 transition text-xs"
              title="Fit to screen"
            >⊡</button>
          </div>
        </div>

        {/* Right: info + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Resolution */}
          <span className="hidden sm:inline text-xs text-white/40 tabular-nums">
            {imgSize.w}×{imgSize.h}
          </span>
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60
              hover:text-white hover:border-white/20 transition"
          >Huỷ</button>
          <button
            onClick={handleConfirm}
            disabled={corners.length < 4}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white
              transition shadow-lg shadow-blue-500/20 disabled:opacity-40"
          >Xác nhận</button>
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div
        className="relative flex-1 overflow-hidden"
        onWheel={onWheel}
        style={{ touchAction: "none" }}
      >
        {/* Transformed canvas */}
        <div
          style={{
            position: "absolute",
            transformOrigin: "0 0",
            transform: `translate(${xform.x}px, ${xform.y}px) scale(${xform.scale})`,
            willChange: "transform",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ display: "block", cursor: "crosshair", touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        {/* ── Info overlay (bottom-left) ── */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {/* Resolution badge */}
          <div className="flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1.5">
            <svg className="h-3 w-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-xs text-white/60 tabular-nums">{imgSize.w} × {imgSize.h} px</span>
          </div>

          {/* Corner coords */}
          <div className="rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1.5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {corners.map(([x, y], i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ background: COLORS[i] }}
                  />
                  <span className="text-xs text-white/60 tabular-nums">
                    {x}, {y}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Corner legend (bottom-right) ── */}
        <div className="absolute bottom-3 right-3 flex gap-2 pointer-events-none">
          {LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
              <span className="text-xs text-white/60">Góc {label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
