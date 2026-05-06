"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface Props {
  cameraId: string;
  clubName: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function QRModal({ cameraId, clubName, onClose, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `https://academy.arenabilliard.com?cameraId=${cameraId}`;
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    QRCode.toCanvas(canvasRef.current, url, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(() => {
      // Tự động lưu QR code vào database sau khi tạo xong
      if (!saved && canvasRef.current) {
        saveQRCode();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function saveQRCode() {
    const canvas = canvasRef.current;
    if (!canvas || saved) return;
    
    const imageBase64 = canvas.toDataURL("image/png");
    
    try {
      await fetch("/api/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraId,
          name: clubName,
          qrImageBase64: imageBase64,
          url,
        }),
      });
      setSaved(true);
      onSaved?.(); // Thông báo đã lưu thành công
    } catch (err) {
      console.error("Failed to save QR code:", err);
    }
  }

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const imageBase64 = canvas.toDataURL("image/png");
    
    // Tải xuống file
    const link = document.createElement("a");
    link.download = `qr-${clubName.replace(/\s+/g, "-")}.png`;
    link.href = imageBase64;
    link.click();
  }

  function handleCopy() {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/30 to-blue-500/20 px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Thiết bị đã được tạo!</h3>
            <p className="text-xs text-blue-300 mt-0.5 truncate max-w-[220px]">{clubName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4 px-5 py-6">
          <div 
            className="rounded-xl bg-white p-3 shadow-lg shadow-blue-500/10 cursor-pointer relative group/qr"
            onClick={handleDownload}
            title="Nhấn để tải xuống"
          >
            <canvas ref={canvasRef} />
            
            {/* Download overlay hint */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/qr:bg-black/10 transition rounded-xl">
              <div className="opacity-0 group-hover/qr:opacity-100 transition bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Nhấn để tải xuống
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500
              py-2.5 text-sm font-bold text-white transition shadow-lg shadow-blue-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải QR Code
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60
              hover:text-white hover:border-white/20 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
