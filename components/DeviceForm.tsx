"use client";

import { useState, useEffect, useRef } from "react";
import TableCornerPicker from "./TableCornerPicker";

interface CheckDeviceResult {
  id: string;
  branchId: string;
  [key: string]: unknown;
}

interface Props {
  onSuccess: () => void;
}

type VerifyStatus = "idle" | "checking" | "success" | "error";
type RtspStatus = "idle" | "checking" | "success" | "error";
type Step = "idle" | "saving" | "done";

export default function DeviceForm({ onSuccess }: Props) {
  const [clubName, setClubName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [rtspURL, setRtspURL] = useState("");

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [deviceInfo, setDeviceInfo] = useState<CheckDeviceResult | null>(null);

  const [rtspStatus, setRtspStatus] = useState<RtspStatus>("idle");
  const [tableCorners, setTableCorners] = useState<number[][] | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [captureFrame, setCaptureFrame] = useState<string | null>(null);
  const [capturingFrame, setCapturingFrame] = useState(false);

  const [step, setStep] = useState<Step>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rtspDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-verify Device ID with debounce ───────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = deviceId.trim();

    if (!trimmed) {
      setVerifyStatus("idle");
      setDeviceInfo(null);
      return;
    }

    setVerifyStatus("checking");
    setDeviceInfo(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-device?deviceId=${encodeURIComponent(trimmed)}`);
        const data = await res.json();

        if (!res.ok || !data.id || !data.branchId) {
          setVerifyStatus("error");
          setDeviceInfo(null);
          return;
        }

        setDeviceInfo(data as CheckDeviceResult);
        setVerifyStatus("success");
      } catch {
        setVerifyStatus("error");
        setDeviceInfo(null);
      }
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [deviceId]);

  // ── Auto-check RTSP with debounce ─────────────────────────────────────────
  useEffect(() => {
    if (rtspDebounceRef.current) clearTimeout(rtspDebounceRef.current);

    const trimmed = rtspURL.trim();

    if (!trimmed) {
      setRtspStatus("idle");
      setTableCorners(null);
      return;
    }

    setRtspStatus("checking");
    setTableCorners(null);

    rtspDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-rtsp?url=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setRtspStatus(data.ok ? "success" : "error");
      } catch {
        setRtspStatus("error");
      }
    }, 800);

    return () => {
      if (rtspDebounceRef.current) clearTimeout(rtspDebounceRef.current);
    };
  }, [rtspURL]);

  // ── Capture frame + open picker ──────────────────────────────────────────
  async function handleOpenPicker() {
    if (!rtspURL.trim()) return;
    setCapturingFrame(true);
    try {
      const res = await fetch("/api/capture-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtspUrl: rtspURL.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.frame) {
        setCaptureFrame(data.frame);
        setShowPicker(true);
      }
    } catch {
      // silent
    } finally {
      setCapturingFrame(false);
    }
  }

  function handlePickerConfirm(corners: number[][]) {
    setTableCorners(corners);
    setShowPicker(false);
  }

  // ── Save to MongoDB ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!clubName.trim() || !rtspURL.trim() || !deviceInfo) return;

    setStep("saving");
    setSaveMessage("");
    setSaveError(false);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: clubName.trim(),
          deviceId: deviceId.trim(),
          rtspURL: rtspURL.trim(),
          branchId: deviceInfo.branchId,
          scoreboardId: deviceInfo.id,
          tableCorners: tableCorners ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi khi lưu dữ liệu.");

      setStep("done");
      setSaveMessage("Thiết bị đã được lưu thành công!");
      onSuccess();

      setTimeout(() => {
        setClubName("");
        setDeviceId("");
        setRtspURL("");
        setDeviceInfo(null);
        setVerifyStatus("idle");
        setRtspStatus("idle");
        setTableCorners(null);
        setStep("idle");
        setSaveMessage("");
      }, 2000);
    } catch (err) {
      setStep("idle");
      setSaveError(true);
      setSaveMessage(err instanceof Error ? err.message : "Lỗi không xác định.");
    }
  }

  const isSaving = step === "saving";
  const isDone = step === "done";
  const verified = verifyStatus === "success";
  const rtspOk = rtspStatus === "success";
  const canSubmit = verified && rtspOk && clubName.trim() !== "" && !isSaving && !isDone;

  return (
    <>
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-blue-600/30 to-blue-500/20 px-6 py-5 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/30 text-blue-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
          Thêm Thiết Bị Mới
        </h2>
        <p className="text-sm text-blue-300 mt-1">Điền thông tin và xác minh thiết bị trước khi lưu</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Club Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-200">
            Tên Club <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="VD: Arena Billiard Quận 1"
            disabled={isSaving || isDone}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
        </div>

        {/* Device ID — auto verify */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-200">
            Device ID <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="VD: 52a8b38a11a58e44"
              disabled={isSaving || isDone}
              className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-white placeholder-white/30
                focus:outline-none focus:ring-2 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed transition
                ${verifyStatus === "success"
                  ? "border-emerald-500/50 focus:ring-emerald-500"
                  : verifyStatus === "error"
                  ? "border-red-500/50 focus:ring-red-500"
                  : "border-white/10 focus:ring-blue-500"
                }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {verifyStatus === "checking" && <Spinner className="text-blue-400" />}
              {verifyStatus === "success" && <CheckIcon className="text-emerald-400" />}
              {verifyStatus === "error" && <XIcon className="text-red-400" />}
            </div>
          </div>

          {verifyStatus === "success" && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckIcon className="h-3.5 w-3.5" />
              Xác minh thành công
            </p>
          )}
          {verifyStatus === "error" && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
              <XIcon className="h-3.5 w-3.5" />
              Vui lòng kiểm tra lại
            </p>
          )}
        </div>

        {/* RTSP URL — auto check + draw button */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-200">
            RTSP URL <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={rtspURL}
              onChange={(e) => setRtspURL(e.target.value)}
              placeholder="VD: rtsp://admin:pass@192.168.1.100:554/stream"
              disabled={isSaving || isDone}
              className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-12 text-white placeholder-white/30
                focus:outline-none focus:ring-2 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed transition font-mono text-sm
                ${rtspStatus === "success"
                  ? "border-emerald-500/50 focus:ring-emerald-500"
                  : rtspStatus === "error"
                  ? "border-red-500/50 focus:ring-red-500"
                  : "border-white/10 focus:ring-blue-500"
                }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rtspStatus === "checking" && <Spinner className="text-blue-400" />}
              {rtspStatus === "success" && <CheckIcon className="text-emerald-400" />}
              {rtspStatus === "error" && <XIcon className="text-red-400" />}
            </div>
          </div>

          {rtspStatus === "success" && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckIcon className="h-3.5 w-3.5" />
              RTSP kết nối thành công
            </p>
          )}
          {rtspStatus === "error" && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
              <XIcon className="h-3.5 w-3.5" />
              Không thể kết nối RTSP
            </p>
          )}

          {/* Draw corners button */}
          {rtspOk && (
            <button
              type="button"
              onClick={handleOpenPicker}
              disabled={capturingFrame || isSaving || isDone}
              className="mt-2 flex items-center gap-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30
                px-3 py-2 text-xs font-medium text-blue-300 transition
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {capturingFrame ? (
                <>
                  <Spinner className="text-blue-300" />
                  Đang lấy frame...
                </>
              ) : tableCorners ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5" />
                  Đã xác định góc bàn — Vẽ lại
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Xác định góc bàn
                </>
              )}
            </button>
          )}
        </div>

        {/* Save status message */}
        {saveMessage && (
          <div
            className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium
              ${saveError
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              }`}
          >
            {saveError ? <ErrorIcon /> : <CheckIcon className="mt-0.5" />}
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500
            hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600
            py-3.5 text-base font-bold text-white transition shadow-lg shadow-blue-500/30
            disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Spinner className="text-white" />
              Đang lưu...
            </>
          ) : isDone ? (
            <>
              <CheckIcon />
              Đã lưu thành công!
            </>
          ) : (
            "Lưu Thiết Bị"
          )}
        </button>

        {!verified && (
          <p className="text-center text-xs text-white/30">
            Xác minh Device ID và RTSP để kích hoạt nút lưu
          </p>
        )}
      </form>
    </div>

    {/* Table corner picker modal */}
    {showPicker && captureFrame && (
      <TableCornerPicker
        frameBase64={captureFrame}
        onConfirm={handlePickerConfirm}
        onCancel={() => setShowPicker(false)}
      />
    )}
  </>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
