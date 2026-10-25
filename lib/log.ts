import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface StructuredLogPayload {
  event: string;
  requestId?: string;
  userIdHash?: string;
  orgId?: string;
  scopeType?: "personal" | "org" | "platform" | "system";
  caseId?: string;
  ruleId?: string;
  durationMs?: number;
  statusCode?: number;
  code?: string;
  path?: string;
  method?: string;
  provider?: string;
  model?: string;
  inputBytes?: number;
  pageCount?: number;
  outcome?: string;
  error?: string;
}

// Strictly allowlisted keys for logging to prevent accidental PII leakage
const ALLOWLISTED_KEYS = new Set<keyof StructuredLogPayload>([
  "event",
  "requestId",
  "userIdHash",
  "orgId",
  "scopeType",
  "caseId",
  "ruleId",
  "durationMs",
  "statusCode",
  "code",
  "path",
  "method",
  "provider",
  "model",
  "inputBytes",
  "pageCount",
  "outcome",
  "error",
]);

function sanitize(payload: StructuredLogPayload): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (ALLOWLISTED_KEYS.has(key as keyof StructuredLogPayload) && value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

function writeLog(level: LogLevel, payload: StructuredLogPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...sanitize(payload),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (payload: StructuredLogPayload) => writeLog("debug", payload),
  info: (payload: StructuredLogPayload) => writeLog("info", payload),
  warn: (payload: StructuredLogPayload) => writeLog("warn", payload),
  error: (payload: StructuredLogPayload) => writeLog("error", payload),
};
