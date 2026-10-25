-- Down migration for 0001_v1_tables.sql
-- Safely drops v1 additive tables without affecting legacy data
DROP TABLE IF EXISTS "usage_events" CASCADE;
DROP TABLE IF EXISTS "audit_events" CASCADE;
DROP TABLE IF EXISTS "share_links" CASCADE;
DROP TABLE IF EXISTS "rules_v2" CASCADE;
DROP TABLE IF EXISTS "cases_v2" CASCADE;
DROP TABLE IF EXISTS "memberships" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
