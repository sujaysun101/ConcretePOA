# Architecture Decision Records

Format: context → decision → consequences. Status is one of Proposed, Accepted, or Superseded. Everything stays **Proposed** until the owner approves `IMPLEMENTATION_PLAN.md`.

## ADR-000: Base v1 on PR #3, not `main`
- **Status:** Proposed
- **Context:** `main` is a client-only Vite SPA that ships the AI key to the browser. PR #3 already has a server boundary, Clerk, Drizzle, zod, and export.
- **Decision:** Cut `release/v1` from `cursor/next-secure-saas-a13b` and harden it. Port the useful parts of `main` (document preview, custom bank concept, samples).
- **Consequences:** No third rewrite. PR #3's gaps (see plan §1) become the work list.

## ADR-001: Permission matrix in code, roles in Clerk
- **Status:** Proposed
- **Context:** The roles need server-side enforcement that's 100% testable. Clerk custom permissions live in dashboard config that can drift from the code.
- **Decision:** Clerk stores role keys (`org:admin|reviewer|viewer`) and `publicMetadata.platformRole`. `lib/authz.ts` holds a typed permission matrix plus resource-ownership checks. The UI may use Clerk `<Protect>` for display only.
- **Consequences:** Role changes need a code change. That's acceptable, and it's auditable in git.

## ADR-002: Application-level field encryption for PII
- **Status:** Proposed
- **Decision:** AES-256-GCM, a `enc:v1:<kid>:…` envelope, AAD bound to table, column, and row ID, with previous keys kept for decryption only.
- **Consequences:** No SQL search on names. Search runs after decryption within the scope's result set (≤500 rows in v1).

## ADR-003: Structured model output
- **Status:** Proposed
- **Decision:** Anthropic forced tool use and Google `responseJsonSchema`, with JSON Schema derived from zod. Strict validation, one retry, then a typed 422. Normalization only clips lengths *after* validation.
- **Consequences:** Removes the brace-regex parser and the empty-report failure mode.

## ADR-004: Don't store uploaded originals
- **Status:** Proposed
- **Decision:** Originals stay in memory for the length of the request. Only the extracted fields (encrypted) and short evidence quotes are stored. Filenames aren't stored.
- **Consequences:** Users can't re-run an analysis without uploading again. An opt-in storage setting is deferred.

## ADR-005: Neon Postgres
- **Status:** Proposed (pending Q2)
- **Decision:** Neon via the Vercel Marketplace, with branches for previews.

## ADR-006: Reversible, additive migrations
- **Status:** Proposed
- **Decision:** drizzle-kit generates the forward migrations, with hand-written down files. New tables go *alongside* the legacy ones, backfilled via a TS script, then swapped in by renaming. Dropping the legacy tables is a separate, owner-approved migration.

## ADR-007: PGlite for integration tests
- **Status:** Proposed
- **Decision:** Run route-handler integration tests against in-process PGlite so CI needs no Docker, plus a nightly job against real Postgres.
