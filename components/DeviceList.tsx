"use client";

import { useEffect, useState } from "react";

interface Device {
  _id: string;
  clubName: string;
  deviceId: string;
  rtspURL: string;
  branchId: string;
  scoreboardId: string;
  createdAt: string;
}

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => {
        setDevices(data.devices ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải danh sách thiết bị.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-purple-300 gap-3">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Đang tải danh sách...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-slate-700/30 to-slate-600/20 px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/30 text-slate-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </span>
            Danh Sách Thiết Bị
          </h2>
          <p className="text-sm text-slate-400 mt-1">Tổng cộng {devices.length} thiết bị</p>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30 gap-3">
          <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
          <p className="text-sm">Chưa có thiết bị nào được thêm</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {devices.map((device) => (
            <DeviceRow key={device._id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceRow({ device }: { device: Device }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-6 py-4 hover:bg-white/5 transition">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{device.clubName}</p>
              <p className="text-xs text-purple-300 font-mono truncate">{device.deviceId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Active
            </span>
            <svg
              className={`h-4 w-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailItem label="Branch ID" value={device.branchId} mono />
          <DetailItem label="Scoreboard ID" value={device.scoreboardId} mono />
          <DetailItem label="RTSP URL" value={device.rtspURL} mono />
          <DetailItem
            label="Ngày thêm"
            value={new Date(device.createdAt).toLocaleString("vi-VN")}
          />
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={`text-sm text-white break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
