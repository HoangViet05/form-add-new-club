"use client";

import { useEffect, useState } from "react";

interface QRCodeItem {
  _id: string;
  cameraId: string;
  name: string;
  qrImageBase64: string;
  url: string;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeListModal({ isOpen, onClose }: Props) {
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchQRCodes();
    }
  }, [isOpen]);

  async function fetchQRCodes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/qrcodes");
      const data = await res.json();
      
      if (data.success) {
        setQrCodes(data.qrCodes ?? []);
      } else {
        setError("Không thể tải danh sách QR codes");
      }
    } catch {
      setError("Lỗi khi tải danh sách QR codes");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(qrCode: QRCodeItem) {
    const link = document.createElement("a");
    link.download = `qr-${qrCode.name.replace(/\s+/g, "-")}.png`;
    link.href = qrCode.qrImageBase64;
    link.click();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/30 to-purple-500/20 px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/30 text-purple-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </span>
              QR Codes Đã Lưu
            </h2>
            <p className="text-sm text-purple-300 mt-1">Tổng cộng {qrCodes.length} QR codes</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-purple-300 gap-3">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tải danh sách QR codes...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
              <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-sm">Chưa có QR code nào được tạo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {qrCodes.map((qrCode) => (
                <QRCodeCard key={qrCode._id} qrCode={qrCode} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500
              hover:from-purple-500 hover:to-purple-400 px-6 py-2.5 text-sm font-bold text-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function QRCodeCard({ 
  qrCode, 
  onDownload 
}: { 
  qrCode: QRCodeItem; 
  onDownload: (qrCode: QRCodeItem) => void;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "unavailable">("idle");

  async function handleCopyImage() {
    setCopyStatus("copying");
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !window.ClipboardItem) {
        setCopyStatus("unavailable");
        setTimeout(() => setCopyStatus("idle"), 3000);
        return;
      }

      // Convert base64 to blob
      const response = await fetch(qrCode.qrImageBase64);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy image:", err);
      setCopyStatus("unavailable");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-purple-500/30 transition group">
      {/* QR Image - Clickable to copy */}
      <div 
        className="bg-white p-4 flex items-center justify-center cursor-pointer relative group/image"
        onClick={handleCopyImage}
        title="Nhấn để copy ảnh"
      >
        <img 
          src={qrCode.qrImageBase64} 
          alt={`QR Code for ${qrCode.name}`}
          className="w-full h-auto max-w-[200px] transition group-hover/image:opacity-90"
        />
        
        {/* Copy overlay hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/image:bg-black/10 transition">
          <div className="opacity-0 group-hover/image:opacity-100 transition bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
            {copyStatus === "copying" ? "Đang copy..." : 
             copyStatus === "success" ? "✓ Đã copy!" : 
             copyStatus === "unavailable" ? "Không khả dụng" :
             "Nhấn để copy ảnh"}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white truncate">{qrCode.name}</h3>
          <p className="text-xs text-white/40 font-mono truncate mt-1">{qrCode.cameraId}</p>
        </div>

        <div className="text-xs text-white/30">
          {new Date(qrCode.createdAt).toLocaleString("vi-VN")}
        </div>

        {/* Clipboard unavailable notice */}
        {copyStatus === "unavailable" && (
          <div className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5">
            💡 Copy ảnh cần HTTPS. Vui lòng dùng "Tải xuống"
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDownload(qrCode)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 
              border border-purple-500/30 px-3 py-2 text-xs font-medium text-purple-300 transition"
            title="Tải xuống file"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải xuống
          </button>
          <button
            onClick={handleCopyImage}
            disabled={copyStatus === "copying"}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 
              border border-blue-500/30 px-3 py-2 text-xs font-medium text-blue-300 transition
              disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy ảnh"
          >
            {copyStatus === "success" ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đã copy!
              </>
            ) : copyStatus === "unavailable" ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Không khả dụng
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy ảnh
              </>
            )}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(qrCode.url)}
            className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 
              text-white/60 hover:text-white transition"
            title="Copy URL"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

