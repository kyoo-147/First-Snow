"use client";

import { useEffect, useRef, useState } from "react";

export type SessionMediaStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

type SessionMediaKind = "audio" | "video";

type SessionMediaState = {
  audioStatus: SessionMediaStatus;
  videoStatus: SessionMediaStatus;
  audioStream: MediaStream | null;
  videoStream: MediaStream | null;
  errorMessage: string | null;
  isSupported: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function mapPermissionError(error: unknown): SessionMediaStatus {
  if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
    return "denied";
  }

  return "error";
}

export function useSessionMedia() {
  const [state, setState] = useState<SessionMediaState>({
    audioStatus: "idle",
    videoStatus: "idle",
    audioStream: null,
    videoStream: null,
    errorMessage: null,
    isSupported: true,
    hasAudio: false,
    hasVideo: false
  });

  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  async function request(kind: SessionMediaKind) {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState((current) => ({
        ...current,
        [`${kind}Status`]: "unsupported",
        isSupported: false,
        errorMessage: "Trình duyệt này chưa hỗ trợ xin quyền mic/camera qua MediaDevices."
      }));
      return;
    }

    setState((current) => ({
      ...current,
      [`${kind}Status`]: "requesting",
      errorMessage: null
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: kind === "audio",
        video: kind === "video"
      });

      if (kind === "audio") {
        stopStream(audioStreamRef.current);
        audioStreamRef.current = stream;
      } else {
        stopStream(videoStreamRef.current);
        videoStreamRef.current = stream;
      }

      setState((current) => ({
        ...current,
        audioStream: audioStreamRef.current,
        videoStream: videoStreamRef.current,
        [`${kind}Status`]: "granted",
        hasAudio: Boolean(audioStreamRef.current),
        hasVideo: Boolean(videoStreamRef.current),
        errorMessage: null
      }));
    } catch (error) {
      const nextStatus = mapPermissionError(error);
      setState((current) => ({
        ...current,
        [`${kind}Status`]: nextStatus,
        errorMessage:
          nextStatus === "denied"
            ? "Quyền truy cập bị từ chối. Phụ huynh có thể bật lại trong cài đặt trình duyệt."
            : "Không thể mở thiết bị media. Hãy kiểm tra mic/camera hoặc thử trình duyệt khác."
      }));
    }
  }

  function requestAudio() {
    return request("audio");
  }

  function requestVideo() {
    return request("video");
  }

  function stopAll() {
    stopStream(audioStreamRef.current);
    stopStream(videoStreamRef.current);
    audioStreamRef.current = null;
    videoStreamRef.current = null;
    setState((current) => ({
      ...current,
      audioStream: null,
      videoStream: null,
      audioStatus: current.audioStatus === "unsupported" ? "unsupported" : "idle",
      videoStatus: current.videoStatus === "unsupported" ? "unsupported" : "idle",
      hasAudio: false,
      hasVideo: false
    }));
  }

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setState((current) => ({
        ...current,
        audioStatus: "unsupported",
        videoStatus: "unsupported",
        isSupported: false,
        errorMessage: "Trình duyệt này chưa hỗ trợ MediaDevices."
      }));
    }

    return () => {
      stopStream(audioStreamRef.current);
      stopStream(videoStreamRef.current);
    };
  }, []);

  return {
    ...state,
    requestAudio,
    requestVideo,
    stopAll
  };
}
