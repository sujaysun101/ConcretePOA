import { getDb } from "@/lib/db";
import { cases, casesV2, rules, rulesV2 } from "@/lib/db/schema";
import { encryptField } from "@/lib/crypto";
import { logger } from "@/lib/log";

interface LegacyFinding {
  extractedData?: {
    rawText?: string;
    [key: string]: unknown;
  };
  primaryRedFlags?: string[];
  clauseAudit?: string[];
  executionAudit?: string[];
  [key: string]: unknown;
}

/**
 * Idempotent and resumable backfill script to migrate legacy cases & rules to V2.
 * Encrypts PII, strips rawText, and preserves legacy IDs.
 */
export async function runBackfill(): Promise<{ casesMigrated: number; rulesMigrated: number }> {
  const db = getDb();
  if (!db) {
    logger.info({ event: "backfill_skipped", outcome: "no_db" });
    return { casesMigrated: 0, rulesMigrated: 0 };
  }

  let casesMigrated = 0;
  let rulesMigrated = 0;

  // 1. Migrate cases
  const oldCases = await db.select().from(cases);
  for (const c of oldCases) {
    // Check if already migrated
    const existing = await db.query.casesV2.findFirst({
      where: (table, { eq }) => eq(table.legacyId, c.id),
    });
    if (existing) continue;

    // Strip rawText from findings to maintain data minimization
    const rawFindings = (c.findings ?? {}) as LegacyFinding;
    if (rawFindings.extractedData && "rawText" in rawFindings.extractedData) {
      delete rawFindings.extractedData.rawText;
    }

    // Encrypt sensitive fields
    const titleEnc = encryptField(c.title) || "";
    const principalEnc = encryptField(c.principal);
    const agentEnc = encryptField(c.agent);
    const findingsEnc = encryptField(JSON.stringify(rawFindings)) || "";

    const nonPiiSummary = {
      score: c.score ?? 0,
      mode: c.kind,
      redFlagCount: Array.isArray(rawFindings.primaryRedFlags) ? rawFindings.primaryRedFlags.length : 0,
      clauseCount: Array.isArray(rawFindings.clauseAudit) ? rawFindings.clauseAudit.length : 0,
      executionCount: Array.isArray(rawFindings.executionAudit) ? rawFindings.executionAudit.length : 0,
    };

    await db.insert(casesV2).values({
      legacyId: c.id,
      ownerType: "org",
      ownerId: c.orgId,
      createdBy: c.userId,
      mode: c.kind,
      status: c.status,
      targetBank: c.bankTarget,
      jurisdiction: c.state,
      titleEnc,
      principalEnc,
      agentEnc,
      executionDate: c.executionDate,
      findingsEnc,
      score: c.score,
      summary: nonPiiSummary,
      isSample: c.isSample,
      isDemo: c.isDemo,
      model: "unknown-legacy",
      promptVersion: "legacy",
      ruleLibraryVersion: "legacy",
      createdAt: c.createdAt,
    });
    casesMigrated++;
  }

  // 2. Migrate rules
  const oldRules = await db.select().from(rules);
  for (const r of oldRules) {
    const existing = await db.query.rulesV2.findFirst({
      where: (table, { eq }) => eq(table.legacyId, r.id),
    });
    if (existing) continue;

    await db.insert(rulesV2).values({
      legacyId: r.id,
      ownerType: r.orgId ? "org" : "system",
      ownerId: r.orgId ?? null,
      kind: r.custom ? "custom" : "bank",
      name: r.topic,
      payload: {
        requirement: r.requirement,
        severity: r.severity,
        notes: r.notes,
        scope: r.scope,
      },
      citation: r.citation,
      reviewStatus: "unreviewed",
      createdAt: r.createdAt,
    });
    rulesMigrated++;
  }

  logger.info({
    event: "backfill_completed",
    outcome: `cases_${casesMigrated}_rules_${rulesMigrated}`,
  });

  return { casesMigrated, rulesMigrated };
}

if (process.argv[1] && process.argv[1].endsWith("backfill-v1.ts")) {
  runBackfill()
    .then((res) => {
      console.log(`Backfill finished: ${res.casesMigrated} cases, ${res.rulesMigrated} rules migrated.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Backfill failed:", err);
      process.exit(1);
    });
}
