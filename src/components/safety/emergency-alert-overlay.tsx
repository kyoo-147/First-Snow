"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, CheckCircle2, ShieldAlert } from "lucide-react";
import { getAlerts, markAlertRead, type ApiAlert } from "@/lib/companion-client";

const POLL_MS = 10_000;

function playAlertTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.7);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.72);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Browsers may block audio before a user gesture; the visual alert remains authoritative.
  }
}

export function EmergencyAlertOverlay() {
  const pathname = usePathname();
  const [alert, setAlert] = useState<ApiAlert | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const soundedAlertId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const alerts = await getAlerts();
      const urgent = alerts.find((item) => item.severity === "high" && !item.readAt) ?? null;
      setAlert(urgent);
      if (urgent && soundedAlertId.current !== urgent.id) {
        soundedAlertId.current = urgent.id;
        playAlertTone();
      }
    } catch {
      // The dashboard remains usable; the regular alerts page shows fetch errors.
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh]);

  if (!alert || pathname.startsWith("/parent/alerts")) return null;

  async function acknowledge() {
    setAcknowledging(true);
    try {
      await markAlertRead(alert!.id);
      setAlert(null);
    } finally {
      setAcknowledging(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="emergency-alert-title">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] border border-red-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-red-600 px-6 py-4 text-white">
          <span className="grid size-11 place-items-center rounded-full bg-white/15"><BellRing className="size-6 animate-pulse" /></span>
          <div><p className="text-xs font-black uppercase tracking-[0.16em]">AgentKid</p><p className="text-sm font-semibold text-red-50">Thông báo an toàn ưu tiên cao</p></div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-5 grid size-14 place-items-center rounded-full bg-red-50 text-red-600"><ShieldAlert className="size-7" /></div>
          <h2 id="emergency-alert-title" className="text-2xl font-black text-slate-950">Cảnh báo khẩn cấp</h2>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600">Hệ thống phát hiện nội dung có thể liên quan đến sự an toàn của trẻ. Vui lòng kiểm tra và liên hệ với trẻ ngay.</p>
          <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{alert.title}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link href={`/parent/alerts/${encodeURIComponent(alert.id)}`} className="snow-focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-black text-slate-900 hover:bg-slate-50">Xem chi tiết</Link>
            <button type="button" disabled={acknowledging} onClick={() => void acknowledge()} className="snow-focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"><CheckCircle2 className="size-4" />{acknowledging ? "Đang xác nhận..." : "Đã nhận"}</button>
          </div>
          <p className="mt-5 text-center text-xs font-semibold text-slate-400">Cảnh báo trong ứng dụng — không phải cuộc gọi điện thoại</p>
        </div>
      </div>
    </div>
  );
}
