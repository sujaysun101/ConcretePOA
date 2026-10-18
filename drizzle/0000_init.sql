CREATE TABLE IF NOT EXISTS "cases" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" text NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "kind" text NOT NULL,
  "status" text NOT NULL,
  "bank_target" text,
  "state" text,
  "principal" text,
  "agent" text,
  "execution_date" text,
  "file_name" text,
  "score" integer,
  "summary" text NOT NULL,
  "findings" jsonb NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "is_sample" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_org_created_idx" ON "cases" ("org_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rules" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" text,
  "scope" text NOT NULL,
  "jurisdiction" text,
  "institution" text,
  "topic" text NOT NULL,
  "requirement" text NOT NULL,
  "severity" text NOT NULL,
  "citation" text,
  "notes" text,
  "year" integer,
  "custom" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rules_org_idx" ON "rules" ("org_id");
