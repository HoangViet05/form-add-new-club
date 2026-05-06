"use client";

import { useState } from "react";
import DeviceForm from "@/components/DeviceForm";
import QRCodeListModal from "@/components/QRCodeListModal";
import StandaloneQR from "@/components/StandaloneQR";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);

  function handleSuccess() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Arena Billiard</h1>
              <p className="text-xs text-blue-300 mt-0.5">Device Management</p>
            </div>
          </div>

          {/* Open QR List Modal Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 
              hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30
              px-4 py-2 text-sm font-medium text-purple-300 transition hover:scale-105 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Xem QR Codes
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <DeviceForm onSuccess={handleSuccess} />
      </main>

      <StandaloneQR />

      {/* QR Code List Modal */}
      <QRCodeListModal 
        key={refreshKey}
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
      />
    </div>
  );
}
