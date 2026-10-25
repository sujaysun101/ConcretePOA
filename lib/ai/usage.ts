import "server-only";
import { getDb } from "@/lib/db";
import { usageEvents } from "@/lib/db/schema";
import { SpendCappedError } from "@/lib/errors";
import { logger } from "@/lib/log";
import { sql, gte } from "drizzle-orm";

export interface RecordUsageParams {
  userId?: string | null;
  orgId?: string | null;
  mode: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  outcome: "ok" | "invalid_output" | "timeout" | "provider_error" | "rate_limited" | "spend_capped";
  attempts?: number;
}

// In-memory ledger for spend tracking when DB is in memory or local dev
let memorySpendToday = 0;
let lastSpendResetDay = new Date().getUTCDate();

function getDailySpendCapUsd(): number {
  const cap = Number(process.env.AI_DAILY_SPEND_CAP_USD ?? 5.0);
  return Number.isFinite(cap) && cap > 0 ? cap : 5.0;
}

/**
 * Estimates USD cost for a given model and token count.
 */
export function estimateCostUsd(
  provider: string,
  model: string,
  inputTokens = 0,
  outputTokens = 0
): number {
  if (provider === "mock" || provider === "poa-engine") {
    return 0;
  }

  // Anthropic Claude 3.5 Sonnet / 4.5 ($3/M in, $15/M out)
  if (provider === "anthropic" || model.includes("claude")) {
    const inCost = (inputTokens / 1_000_000) * 3.0;
    const outCost = (outputTokens / 1_000_000) * 15.0;
    return Number((inCost + outCost).toFixed(5));
  }

  // Google Gemini ($0.075-$1.25/M in, $0.30-$5.00/M out)
  if (provider === "google" || model.includes("gemini")) {
    const inCost = (inputTokens / 1_000_000) * 0.5;
    const outCost = (outputTokens / 1_000_000) * 1.5;
    return Number((inCost + outCost).toFixed(5));
  }

  return 0.001; // default nominal cost
}

/**
 * Checks if system daily spend has hit the ceiling.
 * Throws SpendCappedError if ceiling exceeded.
 */
export async function assertUnderSpendCeiling(estimatedCostUsd = 0.01): Promise<void> {
  const cap = getDailySpendCapUsd();
  const db = getDb();

  const currentUtcDay = new Date().getUTCDate();
  if (currentUtcDay !== lastSpendResetDay) {
    memorySpendToday = 0;
    lastSpendResetDay = currentUtcDay;
  }

  if (!db) {
    if (memorySpendToday + estimatedCostUsd > cap) {
      throw new SpendCappedError(
        `Daily AI spend ceiling ($${cap.toFixed(2)}) reached. Please try again tomorrow.`
      );
    }
    return;
  }

  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const rows = await db
      .select({
        totalCost: sql<string>`coalesce(sum(cast(${usageEvents.estCostUsd} as numeric)), 0)`,
      })
      .from(usageEvents)
      .where(gte(usageEvents.at, startOfDay));

    const totalSpent = Number(rows[0]?.totalCost ?? 0);
    if (totalSpent + estimatedCostUsd > cap) {
      logger.warn({
        event: "spend_ceiling_exceeded",
        code: "spend_capped",
        outcome: `spent_${totalSpent.toFixed(2)}_cap_${cap.toFixed(2)}`,
      });
      throw new SpendCappedError(
        `Daily AI spend ceiling ($${cap.toFixed(2)}) reached. Please try again tomorrow.`
      );
    }
  } catch (err) {
    if (err instanceof SpendCappedError) throw err;
    // Log error but don't fail closed solely on transient query failure unless strict prod
    logger.warn({ event: "spend_check_query_error", error: String(err) });
  }
}

/**
 * Records an AI usage event into persistent storage and/or memory.
 */
export async function recordUsageEvent(params: RecordUsageParams): Promise<void> {
  const cost = estimateCostUsd(
    params.provider,
    params.model,
    params.inputTokens,
    params.outputTokens
  );

  memorySpendToday += cost;

  const db = getDb();
  if (db) {
    try {
      await db.insert(usageEvents).values({
        userId: params.userId ?? null,
        orgId: params.orgId ?? null,
        mode: params.mode,
        provider: params.provider,
        model: params.model,
        inputTokens: params.inputTokens ?? null,
        outputTokens: params.outputTokens ?? null,
        estCostUsd: cost.toFixed(5),
        latencyMs: params.latencyMs,
        outcome: params.outcome,
        attempts: params.attempts ?? 1,
      });
    } catch (err) {
      logger.error({
        event: "usage_event_insert_failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info({
    event: "ai_usage_recorded",
    provider: params.provider,
    model: params.model,
    durationMs: params.latencyMs,
    outcome: params.outcome,
  });
}
