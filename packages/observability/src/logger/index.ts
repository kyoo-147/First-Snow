export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEvent {
  level: LogLevel;
  action: string;
  message: string;
  requestId?: string;
  jobId?: string;
  sessionId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export type LogSink = (event: LogEvent) => void;

const defaultSink: LogSink = (event) => {
  const { level, ...payload } = event;
  const line = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    ...payload
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export function createLogger(base: Partial<Pick<LogEvent, "requestId" | "jobId" | "sessionId">> = {}, sink = defaultSink) {
  return {
    debug(action: string, message: string, metadata?: LogEvent["metadata"]) {
      sink({ ...base, level: "debug", action, message, metadata });
    },
    info(action: string, message: string, metadata?: LogEvent["metadata"]) {
      sink({ ...base, level: "info", action, message, metadata });
    },
    warn(action: string, message: string, metadata?: LogEvent["metadata"]) {
      sink({ ...base, level: "warn", action, message, metadata });
    },
    error(action: string, message: string, metadata?: LogEvent["metadata"]) {
      sink({ ...base, level: "error", action, message, metadata });
    }
  };
}
