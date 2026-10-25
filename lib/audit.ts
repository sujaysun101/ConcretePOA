import "server-only";
import { getDb } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";
import { hashAuditValue } from "@/lib/crypto";
import { logger } from "@/lib/log";
import { headers } from "next/headers";

export type AuditAction =
  | "case.create"
  | "case.read"
  | "case.delete"
  | "case.export"
  | "case.share_create"
  | "case.share_revoke"
  | "case.share_view"
  | "rule.create"
  | "rule.update"
  | "rule.delete"
  | "org.update"
  | "org.retention_run"
  | "user.login"
  | "user.export"
  | "user.delete";

export interface RecordAuditParams {
  actorUserId?: string | null;
  actorType: "user" | "platform_admin" | "system" | "share_link" | "webhook";
  scopeType: "personal" | "org" | "platform";
  scopeId?: string | null;
  action: AuditAction;
  targetType?: "case" | "rule" | "org" | "share_link" | "user";
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  reqHeaders?: Headers;
}

/**
 * Appends a zero-PII security audit record.
 * IP address and user-agent are pseudonymized using HMAC-SHA256.
 */
export async function recordAuditEvent(params: RecordAuditParams): Promise<void> {
  const db = getDb();
  let ipHash: string | null = null;
  let userAgentHash: string | null = null;
  let requestId: string | null = null;

  try {
    let hdrs = params.reqHeaders;
    if (!hdrs) {
      try {
        hdrs = await headers();
      } catch {
        // Ignored when outside a Next.js request context (e.g. background job/cron)
      }
    }

    if (hdrs) {
      const rawIp = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip");
      const rawUa = hdrs.get("user-agent");
      requestId = hdrs.get("x-request-id") || null;

      ipHash = hashAuditValue(rawIp);
      userAgentHash = hashAuditValue(rawUa);
    }

    // Always log non-PII structured event
    logger.info({
      event: `audit_${params.action.replace(".", "_")}`,
      scopeType: params.scopeType,
      outcome: "recorded",
    });

    if (db) {
      await db.insert(auditEvents).values({
        actorUserId: params.actorUserId ?? null,
        actorType: params.actorType,
        scopeType: params.scopeType,
        scopeId: params.scopeId ?? null,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        ipHash,
        userAgentHash,
        requestId,
        metadata: params.metadata ?? null,
      });
    }
  } catch (err) {
    logger.warn({
      event: "audit_record_failed",
      error: err instanceof Error ? err.message : "Database write failed",
    });
  }
}
