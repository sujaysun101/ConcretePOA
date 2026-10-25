CREATE TABLE "audit_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text,
	"actor_type" text NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"ip_hash" text,
	"user_agent_hash" text,
	"request_id" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "cases" (
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text,
	"owner_type" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_by" text,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"target_bank" text,
	"jurisdiction" text,
	"title_enc" text NOT NULL,
	"principal_enc" text,
	"agent_enc" text,
	"execution_date" text,
	"findings_enc" text NOT NULL,
	"score" integer,
	"summary" jsonb NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"model" text,
	"prompt_version" text,
	"rule_library_version" text,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"purge_after" timestamp with time zone,
	CONSTRAINT "cases_v2_legacy_id_unique" UNIQUE("legacy_id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"retention_days" integer,
	"require_mfa" boolean DEFAULT false NOT NULL,
	"rate_limit_per_min" integer,
	"rate_limit_per_day" integer,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rules" (
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules_v2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" text,
	"owner_type" text NOT NULL,
	"owner_id" text,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"source_url" text,
	"citation" text,
	"effective_date" text,
	"last_reviewed_at" text,
	"review_status" text DEFAULT 'unreviewed' NOT NULL,
	"library_version" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "rules_v2_legacy_id_unique" UNIQUE("legacy_id")
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"passcode_hash" text,
	"created_by" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"org_id" text,
	"mode" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"est_cost_usd" text,
	"latency_ms" integer,
	"outcome" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email_hash" text,
	"email_enc" text,
	"platform_role" text,
	"disabled_at" timestamp with time zone,
	"disclaimer_version" text,
	"disclaimer_accepted_at" timestamp with time zone,
	"terms_version" text,
	"terms_accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cases_v2" ADD CONSTRAINT "cases_v2_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules_v2" ADD CONSTRAINT "rules_v2_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_case_id_cases_v2_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases_v2"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_scope_at_idx" ON "audit_events" USING btree ("scope_type","scope_id","at");--> statement-breakpoint
CREATE INDEX "audit_events_target_idx" ON "audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "cases_org_created_idx" ON "cases" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "cases_v2_owner_created_idx" ON "cases_v2" USING btree ("owner_type","owner_id","created_at");--> statement-breakpoint
CREATE INDEX "cases_v2_purge_idx" ON "cases_v2" USING btree ("purge_after");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rules_org_idx" ON "rules" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "rules_v2_owner_kind_idx" ON "rules_v2" USING btree ("owner_type","owner_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "share_links_token_hash_idx" ON "share_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "share_links_case_idx" ON "share_links" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "usage_events_at_idx" ON "usage_events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "usage_events_org_at_idx" ON "usage_events" USING btree ("org_id","at");