import "server-only";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { casesV2 } from "@/lib/db/schema";
import { recordAuditEvent } from "@/lib/audit";
import { logger } from "@/lib/log";
import { lt, and, isNull } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleRetention(request);
}

export async function POST(request: Request) {
  return handleRetention(request);
}

async function handleRetention(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  // Protect endpoint: require valid Bearer token matching CRON_SECRET in production
  if (process.env.NODE_ENV === "production" || cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn({ event: "retention_cron_unauthorized" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDb();
  let purgedCount = 0;

  try {
    if (db) {
      const now = new Date();

      // 1. Purge expired cases in cases_v2 where purgeAfter < now
      const result = await db
        .update(casesV2)
        .set({ deletedAt: now })
        .where(and(lt(casesV2.purgeAfter, now), isNull(casesV2.deletedAt)))
        .returning({ id: casesV2.id });

      purgedCount = result.length;

      logger.info({
        event: "retention_run_completed",
        outcome: `purged_${purgedCount}`,
      });
    }

    await recordAuditEvent({
      actorType: "system",
      scopeType: "platform",
      action: "org.retention_run",
      metadata: { purgedCases: purgedCount },
    });

    return NextResponse.json({ ok: true, purged: purgedCount });
  } catch (err) {
    logger.error({
      event: "retention_run_failed",
      error: err instanceof Error ? err.message : "Retention execution error",
    });
    return NextResponse.json({ error: "Retention job failed" }, { status: 500 });
  }
}
