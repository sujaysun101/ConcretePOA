import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { databaseUrl, getDb } from "@/lib/db";
import { cases, rules, users } from "@/lib/db/schema";
import { demoCases } from "@/lib/demo-data";
import { builtinRules } from "@/lib/library";
import { buildDashboard } from "@/lib/metrics";
import type { CaseKind, CaseRecord, DashboardData, Findings, RuleRecord } from "@/lib/types";

type MemoryState = {
  cases: CaseRecord[];
  rules: RuleRecord[];
  hiddenDemo: string[];
};

const globalState = globalThis as typeof globalThis & { __concretepoaMemory?: MemoryState };

function memory(): MemoryState {
  if (!globalState.__concretepoaMemory) {
    globalState.__concretepoaMemory = { cases: [], rules: [], hiddenDemo: [] };
  }
  return globalState.__concretepoaMemory;
}

function memoryCases(orgId: string) {
  const state = memory();
  const hidden = new Set(state.hiddenDemo);
  const own = state.cases.filter((item) => item.orgId === orgId);
  const demo = demoCases(orgId).filter((item) => !hidden.has(`${orgId}:${item.id}`));
  return [...own, ...demo].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function rowToCase(row: typeof cases.$inferSelect): CaseRecord {
  return {
    id: row.id,
    orgId: row.orgId,
    userId: row.userId,
    title: row.title,
    kind: row.kind as CaseKind,
    status: row.status === "sample" ? "sample" : "ready",
    bankTarget: row.bankTarget,
    state: row.state,
    principal: row.principal,
    agent: row.agent,
    executionDate: row.executionDate,
    fileName: row.fileName,
    score: row.score,
    summary: row.summary,
    findings: row.findings as Findings,
    isDemo: row.isDemo,
    isSample: row.isSample,
    createdAt: row.createdAt.toISOString(),
  };
}

function rowToRule(row: typeof rules.$inferSelect): RuleRecord {
  return {
    id: row.id,
    orgId: row.orgId ?? null,
    scope: (row.scope as "jurisdiction" | "institution") ?? "jurisdiction",
    jurisdiction: row.jurisdiction ?? null,
    institution: row.institution ?? null,
    topic: row.topic,
    requirement: row.requirement,
    severity: (row.severity as "high" | "medium" | "low") ?? "medium",
    citation: row.citation ?? null,
    notes: row.notes ?? null,
    year: row.year ?? null,
    custom: row.custom,
  };
}

async function withDb<T>(action: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<T> {
  const db = getDb();
  if (!db) throw new Error("NO_DATABASE");
  return action(db);
}

export async function listCases(orgId: string): Promise<CaseRecord[]> {
  if (!databaseUrl()) return memoryCases(orgId);
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(cases)
      .where(eq(cases.orgId, orgId))
      .orderBy(desc(cases.createdAt));
    return rows.map(rowToCase);
  });
}

export async function getCase(orgId: string, id: string): Promise<CaseRecord | null> {
  if (!databaseUrl()) {
    return memoryCases(orgId).find((item) => item.id === id) ?? null;
  }
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(cases)
      .where(and(eq(cases.orgId, orgId), eq(cases.id, id)))
      .limit(1);
    const match = rows[0];
    return match ? rowToCase(match) : null;
  });
}

export async function getCaseById(id: string): Promise<CaseRecord | null> {
  if (!databaseUrl()) {
    const state = memory();
    const own = state.cases.find((item) => item.id === id);
    if (own) return own;
    for (const d of demoCases("")) {
      if (d.id === id) return d;
    }
    return null;
  }
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(cases)
      .where(eq(cases.id, id))
      .limit(1);
    const match = rows[0];
    return match ? rowToCase(match) : null;
  });
}

export async function saveCase(record: CaseRecord) {
  if (!databaseUrl()) {
    memory().cases.unshift(record);
    return record;
  }
  await withDb(async (db) => {
    await db.insert(cases).values({
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
      isDemo: record.isDemo,
      isSample: record.isSample,
      createdAt: new Date(record.createdAt),
    });
  });
  return record;
}

export async function deleteCase(orgId: string, id: string) {
  if (!databaseUrl()) {
    const state = memory();
    const own = state.cases.find((item) => item.id === id && item.orgId === orgId);
    if (own) {
      state.cases = state.cases.filter((item) => item.id !== id);
      return;
    }
    if (demoCases(orgId).some((item) => item.id === id)) {
      state.hiddenDemo.push(`${orgId}:${id}`);
    }
    return;
  }
  await withDb(async (db) => {
    await db.delete(cases).where(and(eq(cases.orgId, orgId), eq(cases.id, id)));
  });
}

export async function listRules(orgId: string) {
  const builtins = builtinRules();
  if (!databaseUrl()) {
    const custom = memory().rules.filter((item) => item.orgId === orgId);
    return [...builtins, ...custom];
  }
  const custom = await withDb(async (db) => {
    const rows = await db.select().from(rules).where(eq(rules.orgId, orgId));
    return rows.map(rowToRule).filter((item) => item.custom);
  });
  return [...builtins, ...custom];
}

export async function getRule(id: string): Promise<RuleRecord | null> {
  if (!databaseUrl()) {
    return memory().rules.find((r) => r.id === id) ?? builtinRules().find((r) => r.id === id) ?? null;
  }
  return withDb(async (db) => {
    const rows = await db.select().from(rules).where(eq(rules.id, id)).limit(1);
    return rows[0] ? rowToRule(rows[0]) : null;
  });
}

export async function addRule(record: RuleRecord) {
  if (!record.orgId) throw new Error("CASE_STORE_UNAVAILABLE");
  if (!databaseUrl()) {
    memory().rules.unshift(record);
    return record;
  }
  await withDb(async (db) => {
    await db.insert(rules).values({
      id: record.id,
      orgId: record.orgId,
      scope: record.scope,
      jurisdiction: record.jurisdiction,
      institution: record.institution,
      topic: record.topic,
      requirement: record.requirement,
      severity: record.severity,
      citation: record.citation,
      notes: record.notes,
      year: record.year,
      custom: true,
    });
  });
  return record;
}

export async function updateRule(id: string, updates: Partial<RuleRecord>) {
  if (!databaseUrl()) {
    const rule = memory().rules.find((r) => r.id === id);
    if (!rule) throw new Error("Rule not found");
    Object.assign(rule, updates);
    return rule;
  }
  return withDb(async (db) => {
    await db
      .update(rules)
      .set({
        topic: updates.topic,
        requirement: updates.requirement,
        severity: updates.severity,
        citation: updates.citation,
        notes: updates.notes,
        jurisdiction: updates.jurisdiction,
        institution: updates.institution,
      })
      .where(eq(rules.id, id));
    const updated = await getRule(id);
    return updated;
  });
}

export async function deleteRule(id: string) {
  if (!databaseUrl()) {
    memory().rules = memory().rules.filter((r) => r.id !== id);
    return;
  }
  await withDb(async (db) => {
    await db.delete(rules).where(eq(rules.id, id));
  });
}

export async function getCasesForExport(userId: string): Promise<CaseRecord[]> {
  if (!databaseUrl()) {
    return memory().cases.filter((c) => c.userId === userId);
  }
  return withDb(async (db) => {
    const rows = await db.select().from(cases).where(eq(cases.userId, userId));
    return rows.map(rowToCase);
  });
}

export async function purgeUserData(userId: string): Promise<void> {
  if (!databaseUrl()) {
    memory().cases = memory().cases.filter((c) => c.userId !== userId);
    return;
  }
  await withDb(async (db) => {
    await db.delete(cases).where(eq(cases.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  });
}

export async function importDemoCases(orgId: string, userId: string) {
  const seeded = demoCases(orgId).map((item) => ({ ...item, userId, isDemo: true }));
  if (!databaseUrl()) return seeded;
  return withDb(async (db) => {
    const existing = await db.select({ id: cases.id }).from(cases).where(eq(cases.orgId, orgId)).limit(1);
    if (existing.length) {
      throw new Error("WORKSPACE_NONEMPTY");
    }
    await db.insert(cases).values(
      seeded.map((record) => ({
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
    );
    return seeded;
  });
}

export async function dashboard(orgId: string): Promise<DashboardData> {
  const rows = await listCases(orgId);
  return buildDashboard(rows, databaseUrl() ? "postgres" : "memory");
}
