"use client";

import { useState } from "react";
import QRModal from "./QRModal";

interface Props {
  onQRSaved?: () => void;
}

export default function StandaloneQR({ onQRSaved }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [cameraId, setCameraId] = useState("");
  const [qrData, setQrData] = useState<{ cameraId: string; clubName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!cameraId.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Lấy tên camera từ database
      const res = await fetch(`/api/camera-name?cameraId=${encodeURIComponent(cameraId.trim())}`);
      const data = await res.json();
      
      if (!res.ok || !data.name) {
        setError("Không tìm thấy camera với ID này");
        setLoading(false);
        return;
      }
      
      setQrData({ cameraId: cameraId.trim(), clubName: data.name });
      setShowInput(false);
      setCameraId("");
      setError("");
    } catch (err) {
      setError("Lỗi khi lấy thông tin camera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowInput(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500
          hover:from-emerald-500 hover:to-emerald-400 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-500/30
          transition-all hover:scale-105 active:scale-95 z-40"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        Tạo QR Code
      </button>

      {/* Input Modal */}
      {showInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowInput(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Tạo mã QR Code</h3>
              <button
                onClick={() => setShowInput(false)}
                className="text-white/40 hover:text-white transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input */}
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-emerald-200">
                  Camera ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  placeholder="VD: 69f7ff83ed567b698982fc1c"
                  autoFocus
                  disabled={loading}
                  onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleGenerate(); }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {error && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!cameraId.trim() || loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500
                  hover:from-emerald-500 hover:to-emerald-400 py-3 text-base font-bold text-white transition
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang tải...
                  </>
                ) : (
                  "Tạo QR Code"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrData && (
        <QRModal
          cameraId={qrData.cameraId}
          clubName={qrData.clubName}
          onClose={() => setQrData(null)}
          onSaved={onQRSaved}
        />
      )}
    </>
  );
}