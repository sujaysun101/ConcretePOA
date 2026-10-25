import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Users & Organizations (Mirrored from Clerk)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  emailHash: text("email_hash"), // Pseudonymized deterministic hash
  emailEnc: text("email_enc"), // Encrypted PII email envelope
  platformRole: text("platform_role"),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
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
  rateLimitPerMin: integer("rate_limit_per_min"),
  rateLimitPerDay: integer("rate_limit_per_day"),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memberships = pgTable(
  "memberships",
  {
    orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // org:admin, org:reviewer, org:viewer
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.orgId, table.userId] }),
    index("memberships_user_idx").on(table.userId),
  ]
);

// ---------------------------------------------------------------------------
// Cases V2 (Encrypted, Zero-rawText Storage)
// ---------------------------------------------------------------------------

export const casesV2 = pgTable(
  "cases_v2",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: text("legacy_id").unique(),
    ownerType: text("owner_type").notNull(), // 'personal' | 'org'
    ownerId: text("owner_id").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    mode: text("mode").notNull(), // 'audit' | 'diagnosis' | 'jurisdiction'
    status: text("status").notNull(), // 'processing' | 'ready' | 'sample' | 'failed'
    targetBank: text("target_bank"),
    jurisdiction: text("jurisdiction"),
    titleEnc: text("title_enc").notNull(), // Encrypted title
    principalEnc: text("principal_enc"), // Encrypted principal name
    agentEnc: text("agent_enc"), // Encrypted agent name(s)
    executionDate: text("execution_date"),
    findingsEnc: text("findings_enc").notNull(), // Encrypted JSON findings (NO rawText)
    score: integer("score"),
    summary: jsonb("summary").notNull(), // Structured non-PII summary object
    isSample: boolean("is_sample").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    model: text("model"),
    promptVersion: text("prompt_version"),
    ruleLibraryVersion: text("rule_library_version"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    purgeAfter: timestamp("purge_after", { withTimezone: true }),
  },
  (table) => [
    index("cases_v2_owner_created_idx").on(table.ownerType, table.ownerId, table.createdAt),
    index("cases_v2_purge_idx").on(table.purgeAfter),
  ]
);

// ---------------------------------------------------------------------------
// Rules V2 (Declarative & Scoped Custom Rules)
// ---------------------------------------------------------------------------

export const rulesV2 = pgTable(
  "rules_v2",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyId: text("legacy_id").unique(),
    ownerType: text("owner_type").notNull(), // 'system' | 'personal' | 'org'
    ownerId: text("owner_id"),
    kind: text("kind").notNull(), // 'bank' | 'jurisdiction' | 'custom'
    name: text("name").notNull(),
    payload: jsonb("payload").notNull(), // Structured zod-validated rule payload
    sourceUrl: text("source_url"),
    citation: text("citation"),
    effectiveDate: text("effective_date"),
    lastReviewedAt: text("last_reviewed_at"),
    reviewStatus: text("review_status").notNull().default("unreviewed"), // 'unreviewed' | 'attorney_reviewed'
    libraryVersion: text("library_version"),
    version: integer("version").notNull().default(1),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("rules_v2_owner_kind_idx").on(table.ownerType, table.ownerId, table.kind),
  ]
);

// ---------------------------------------------------------------------------
// Share Links (Time-limited, Revocable External Views)
// ---------------------------------------------------------------------------

export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: uuid("case_id").notNull().references(() => casesV2.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(), // SHA-256 of 32-byte secret token
    passcodeHash: text("passcode_hash"), // Optional scrypt hash
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    viewCount: integer("view_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("share_links_token_hash_idx").on(table.tokenHash),
    index("share_links_case_idx").on(table.caseId),
  ]
);

// ---------------------------------------------------------------------------
// Audit Events (Strictly Zero-PII Append-Only Security Log)
// ---------------------------------------------------------------------------

export const auditEvents = pgTable(
  "audit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorUserId: text("actor_user_id"),
    actorType: text("actor_type").notNull(), // 'user' | 'platform_admin' | 'system' | 'share_link' | 'webhook'
    scopeType: text("scope_type").notNull(), // 'personal' | 'org' | 'platform'
    scopeId: text("scope_id"),
    action: text("action").notNull(), // e.g. 'case.create', 'case.read', 'case.delete', 'case.export'
    targetType: text("target_type"), // 'case' | 'rule' | 'org' | 'share_link'
    targetId: text("target_id"),
    ipHash: text("ip_hash"), // HMAC-SHA256 salted hash
    userAgentHash: text("user_agent_hash"), // HMAC-SHA256 salted hash
    requestId: text("request_id"),
    metadata: jsonb("metadata"), // Strictly allowlisted non-PII keys
  },
  (table) => [
    index("audit_events_scope_at_idx").on(table.scopeType, table.scopeId, table.at),
    index("audit_events_target_idx").on(table.targetType, table.targetId),
  ]
);

// ---------------------------------------------------------------------------
// Usage & Spend Metering Events
// ---------------------------------------------------------------------------

export const usageEvents = pgTable(
  "usage_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id"),
    orgId: text("org_id"),
    mode: text("mode").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estCostUsd: text("est_cost_usd"),
    latencyMs: integer("latency_ms"),
    outcome: text("outcome").notNull(), // 'ok' | 'timeout' | 'provider_error' | 'spend_capped'
    attempts: integer("attempts").notNull().default(1),
  },
  (table) => [
    index("usage_events_at_idx").on(table.at),
    index("usage_events_org_at_idx").on(table.orgId, table.at),
  ]
);

// ---------------------------------------------------------------------------
// Legacy Table Compatibility Views (For backward compatibility before swap)
// ---------------------------------------------------------------------------

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
