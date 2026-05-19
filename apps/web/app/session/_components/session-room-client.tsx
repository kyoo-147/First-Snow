"use client";

import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  LockKeyhole,
  Mic,
  PauseCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Square
} from "lucide-react";
import { useState } from "react";
import { useSessionMedia, type SessionMediaStatus } from "../_hooks/use-session-media";

type SessionRoomClientProps = {
  childId: string;
};

type SessionState = "ready" | "active" | "completed" | "interrupted";

const statusCopy: Record<SessionMediaStatus, string> = {
  idle: "Chưa bật",
  requesting: "Đang xin quyền",
  granted: "Đã sẵn sàng",
  denied: "Bị từ chối",
  unsupported: "Không hỗ trợ",
  error: "Cần kiểm tra"
};

function MediaStatusPill({
  icon,
  label,
  status
}: {
  icon: React.ReactNode;
  label: string;
  status: SessionMediaStatus;
}) {
  return (
    <span className={`session-status-pill ${status}`}>
      {icon}
      <strong>{label}</strong>
      <em>{statusCopy[status]}</em>
    </span>
  );
}

export function SessionRoomClient({ childId }: SessionRoomClientProps) {
  const media = useSessionMedia();
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("ready");

  const canStart = consentAccepted && media.hasAudio;
  const childName = childId === "demo-child" ? "An" : childId;

  function startSession() {
    if (!canStart) {
      return;
    }

    setSessionState("active");
  }

  function endSession(nextState: "completed" | "interrupted") {
    setSessionState(nextState);
    media.stopAll();
  }

  return (
    <main className="session-room-shell">
      <nav className="session-room-nav" aria-label="Session navigation">
        <a href="/dashboard/session">
          <ChevronLeft size={17} />
          Dashboard phiên học
        </a>
        <div className="session-room-brand">
          <span><Sparkles size={18} strokeWidth={3} /></span>
          AgentKid Session
        </div>
        <span className={`session-state-badge ${sessionState}`}>{sessionState}</span>
      </nav>

      <section className="session-room-grid">
        <article className="session-stage-card">
          <div className="session-copy">
            <span className="section-kicker">Mia companion</span>
            <h1>Mia ở đây để luyện cùng {childName}.</h1>
            <p>
              Một phiên ngắn, chậm và dễ đoán. Phụ huynh kiểm soát mic/camera trước khi bắt đầu;
              AgentKid không lưu raw audio hoặc raw video trong MVP.
            </p>
          </div>

          <div className="mia-session-avatar" aria-label="Mia animation">
            <div className="mia-session-halo" />
            <div className="mia-session-face">
              <span className="mia-session-hair" />
              <span className="mia-session-eye left" />
              <span className="mia-session-eye right" />
              <span className="mia-session-smile" />
            </div>
            <div className="mia-session-shadow" />
          </div>

          <div className="session-prompt-card">
            <span>Mia nói</span>
            <p>“Mình bắt đầu thật chậm nhé. Con chỉ cần thử một câu ngắn thôi.”</p>
          </div>

          <div className="session-action-row">
            <button disabled={!canStart || sessionState === "active"} onClick={startSession} type="button">
              <Play size={17} />
              Bắt đầu phiên
            </button>
            <button
              disabled={sessionState !== "active"}
              onClick={() => endSession("completed")}
              type="button"
            >
              <Square size={16} />
              Hoàn thành
            </button>
            <button
              disabled={sessionState !== "active"}
              onClick={() => endSession("interrupted")}
              type="button"
            >
              <PauseCircle size={17} />
              Dừng nhẹ nhàng
            </button>
          </div>
        </article>

        <aside className="session-control-panel">
          <article className="session-consent-card">
            <span className="section-kicker">Consent gate</span>
            <h2>Phụ huynh xác nhận trước.</h2>
            <p>
              Mic dùng cho voice loop. Camera chỉ phục vụ suy luận cảm xúc trên thiết bị khi được bật.
              Không có upload hay lưu raw media trong prototype này.
            </p>
            <label className="session-consent-check">
              <input
                checked={consentAccepted}
                onChange={(event) => setConsentAccepted(event.target.checked)}
                type="checkbox"
              />
              Tôi đồng ý bật quyền media cho phiên học thử này.
            </label>
          </article>

          <article className="session-device-card">
            <h2>Thiết bị</h2>
            <div className="session-status-stack">
              <MediaStatusPill icon={<Mic size={16} />} label="Mic" status={media.audioStatus} />
              <MediaStatusPill icon={<Camera size={16} />} label="Camera" status={media.videoStatus} />
              <span className={`session-status-pill ${consentAccepted ? "granted" : "idle"}`}>
                <ShieldCheck size={16} />
                <strong>Consent</strong>
                <em>{consentAccepted ? "Đã xác nhận" : "Chưa xác nhận"}</em>
              </span>
            </div>
            {media.errorMessage ? (
              <p className="session-error-note">
                <CircleAlert size={16} />
                {media.errorMessage}
              </p>
            ) : null}
            <div className="session-device-actions">
              <button disabled={!consentAccepted || media.audioStatus === "requesting"} onClick={media.requestAudio} type="button">
                <Mic size={16} />
                Bật mic
              </button>
              <button disabled={!consentAccepted || media.videoStatus === "requesting"} onClick={media.requestVideo} type="button">
                <Camera size={16} />
                Bật camera tùy chọn
              </button>
              <button onClick={media.stopAll} type="button">
                Tắt media
              </button>
            </div>
          </article>

          <article className="session-privacy-card">
            <LockKeyhole size={18} />
            <div>
              <strong>Privacy baseline</strong>
              <p>Không lưu raw media. Transcript, emotion events và metadata chỉ được lưu khi runtime thật được triển khai.</p>
            </div>
          </article>
        </aside>
      </section>

      <section className="session-runtime-grid" aria-label="Session runtime preview">
        <article>
          <span>Transcript</span>
          <p>Prototype UI: transcript live sẽ xuất hiện ở đây sau khi nối STT/chat/TTS.</p>
        </article>
        <article>
          <span>Emotion signal</span>
          <p>Camera permission chỉ mở stream local; face-api và persistence chưa được bật.</p>
        </article>
        <article>
          <span>Guardian layer</span>
          <p>Warning/critical sẽ được đánh giá qua API alerting trong task integration tiếp theo.</p>
        </article>
      </section>
    </main>
  );
}
