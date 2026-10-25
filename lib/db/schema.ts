import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email"),
  platformRole: text("platform_role"),
  disclaimerVersion: text("disclaimer_version"),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at", { withTimezone: true }),
  termsVersion: text("terms_version"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), // Clerk Org ID
  name: text("name").notNull(),
  retentionDays: integer("retention_days"),
  requireMfa: boolean("require_mfa").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memberships = pgTable(
  "memberships",
  {
    orgId: text("org_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.orgId, table.userId] }),
    index("memberships_user_idx").on(table.userId),
  ]
);

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
