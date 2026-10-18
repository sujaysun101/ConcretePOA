import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cases = pgTable(
  "cases",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    bankTarget: text("bank_target"),
    state: text("state"),
    principal: text("principal"),
    agent: text("agent"),
    executionDate: text("execution_date"),
    fileName: text("file_name"),
    score: integer("score"),
    summary: text("summary").notNull(),
    findings: jsonb("findings").notNull(),
    isDemo: boolean("is_demo").notNull().default(false),
    isSample: boolean("is_sample").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("cases_org_created_idx").on(table.orgId, table.createdAt)],
);

export const rules = pgTable(
  "rules",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id"),
    scope: text("scope").notNull(),
    jurisdiction: text("jurisdiction"),
    institution: text("institution"),
    topic: text("topic").notNull(),
    requirement: text("requirement").notNull(),
    severity: text("severity").notNull(),
    citation: text("citation"),
    notes: text("notes"),
    year: integer("year"),
    custom: boolean("custom").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rules_org_idx").on(table.orgId)],
);
