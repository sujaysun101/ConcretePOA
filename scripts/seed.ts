import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { cases, rules } from "../lib/db/schema";
import { demoCases } from "../lib/demo-data";
import { builtinRules } from "../lib/library";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.log("DATABASE_URL is not set. Demo matters stay in the in-memory store. Nothing was written.");
    return;
  }
  const orgId = process.env.SEED_ORG_ID?.trim() || "org_demo_harbor";
  const sql = postgres(url, { max: 1, prepare: false });
  const db = drizzle(sql);
  const matterRows = demoCases(orgId);
  await db
    .insert(cases)
    .values(
      matterRows.map((record) => ({
        id: record.id,
        orgId: record.orgId,
        userId: record.userId,
        title: record.title,
        kind: record.kind,
        status: record.status,
        bankTarget: record.bankTarget,
        state: record.state,
        principal: record.principal,
        agent: record.agent,
        executionDate: record.executionDate,
        fileName: record.fileName,
        score: record.score,
        summary: record.summary,
        findings: record.findings,
        isDemo: true,
        isSample: false,
        createdAt: new Date(record.createdAt),
      })),
    )
    .onConflictDoNothing();
  await db
    .insert(rules)
    .values(
      builtinRules().map((rule) => ({
        id: rule.id,
        orgId: null,
        scope: rule.scope,
        jurisdiction: rule.jurisdiction,
        institution: rule.institution,
        topic: rule.topic,
        requirement: rule.requirement,
        severity: rule.severity,
        citation: rule.citation,
        notes: rule.notes,
        year: rule.year,
        custom: false,
      })),
    )
    .onConflictDoNothing();
  await sql.end();
  console.log(`Seeded demo matters for organization ${orgId} and the shared rule library.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exit(1);
});
