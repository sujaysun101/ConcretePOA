# ConcretePOA Production Launch & Cutover Checklist

> **Target Release:** ConcretePOA v1.0 (Enterprise-Ready Power of Attorney Pre-Flight Compliance System)  
> **Source Branch:** `release/v1`  
> **Production Branch:** `main`  
> **Target URL:** `https://concrete-poa.vercel.app` (custom domain: `https://concretepoa.com`)  
> **Classification:** Security-Critical / Production SaaS

---

## 1. Step 0: Legacy Vite Containment & Gemini Key Rotation

- [ ] **Google Cloud / AI Studio Key Revocation**:
  - Visit the Google Cloud Console (`APIs & Services > Credentials`) or Google AI Studio (`API Keys`).
  - Delete the legacy client-side Gemini API key that was previously bundled into the Vite SPA.
  - Confirm API traffic on that key drops immediately to 0.
- [ ] **Vercel Key Purge**:
  - In Vercel Project Settings (`Settings > Environment Variables`), permanently delete `GEMINI_API_KEY` across all environments (`Production`, `Preview`, `Development`).
  - Note: ConcretePOA v1 uses server-side Anthropic Claude (`ANTHROPIC_API_KEY`) or Google Gemini (`GOOGLE_GENERATIVE_AI_API_KEY`) via the hardened server abstraction in `lib/ai/provider.ts` and the private Google Cloud Run `poa-engine`.
- [ ] **Verify Client Bundle Cleanliness**:
  - Run `npm run scan:secrets` locally and in CI to guarantee 0 secret patterns in static outputs.

---

## 2. Authentication & Identity (Clerk Production Instance)

- [ ] **Switch Clerk Instance**:
  - Switch from the development test instance (`good-grackle-9997.clerk.accounts.dev`) to the production instance (`clerk.concretepoa.com`).
  - Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Vercel Production Environment Variables.
- [ ] **Configure RBAC & Custom Roles**:
  - In Clerk Dashboard (`Organization Settings > Roles & Permissions`), configure the three ConcretePOA roles:
    1. `org:admin`: Workspace administrator (manages team, settings, retention, custom rules, deletes cases).
    2. `org:reviewer`: Active compliance reviewer (can create cases, analyze documents, export reports, share links).
    3. `org:viewer`: Read-only member (can view and export reports, cannot create new cases or share links).
  - **Set Default Member Role to `org:viewer`** (Least-Privilege Principle).
  - **Set Creator Role to `org:admin`**.
- [ ] **Session & Security Policies**:
  - Configure session inactivity timeout to **7 days**.
  - Configure maximum session duration to **30 days**.
  - Enable **Breached Password Protection** on sign-up.
  - Enable **Turnstile / Bot Protection** on sign-up.
- [ ] **Production OAuth Identity Providers**:
  - Swap from Clerk development credentials to production Google OAuth credentials:
    - Google Cloud Console: Set redirect URI to `https://clerk.concretepoa.com/v1/oauth_callback`.
  - Configure Microsoft Entra ID (Azure AD) OAuth if enterprise SSO is desired.
- [ ] **Session Token Template Custom Claims**:
  - In Clerk Dashboard (`JWT Templates > Default Session Token`), include the following claims:
    ```json
    {
      "mfa": "{{user.two_factor_enabled}}",
      "onboarded": "{{user.public_metadata.onboarded}}"
    }
    ```
- [ ] **Svix Webhook Configuration**:
  - In Clerk Dashboard (`Webhooks`), add an endpoint pointing to `https://concretepoa.com/api/webhooks/clerk`.
  - Subscribe to events:
    - `user.created`, `user.updated`, `user.deleted`
    - `organization.created`, `organization.updated`, `organization.deleted`
    - `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
    - `session.created`
  - Copy the Signing Secret (`whsec_...`) and configure `CLERK_WEBHOOK_SECRET` in Vercel.

---

## 3. Database & Storage (Neon Postgres)

- [ ] **Provision Production Database**:
  - Provision Neon Serverless Postgres in `us-east-1` (or matching Vercel region).
  - Enable **Point-in-Time Recovery (PITR)** and automated daily backups.
  - Set `DATABASE_URL` in Vercel with SSL connection pooling (`?sslmode=require`).
- [ ] **Execute Schema Migrations**:
  - From local terminal connected to production or via deployment hook:
    ```powershell
    npm run db:migrate
    ```
  - Verify tables are created: `users`, `organizations`, `memberships`, `cases_v2`, `rules_v2`, `share_links`, `audit_events`, `usage_events`.
- [ ] **Apply Database Permission Hardening**:
  - Execute PostgreSQL permission restriction to make the audit log append-only:
    ```sql
    REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM app_rw;
    ```
- [ ] **Seed Built-in Rule Library**:
  - Run the idempotent seed script to load 15 major financial institution rules and jurisdiction requirements into `rules_v2`:
    ```powershell
    npm run db:seed
    ```

---

## 4. Cryptography & Key Management

- [ ] **Generate Production AES-256 Data Encryption Key**:
  - Generate a secure 32-byte (256-bit) base64 key:
    ```bash
    openssl rand -base64 32
    ```
  - Set `DATA_ENCRYPTION_KEY` in Vercel Production Environment Variables.
  - Set `DATA_ENCRYPTION_KEY_ID="prod-2026-v1"`.
- [ ] **Generate Audit Pseudonymization Salt**:
  - Generate a 32+ character random string for HMAC hashing of IP addresses and User-Agents:
    ```bash
    openssl rand -hex 32
    ```
  - Set `AUDIT_HASH_SALT` in Vercel Production Environment Variables.
- [ ] **Key Rotation Readiness**:
  - Familiarize with `scripts/rotate-keys.ts` for zero-downtime key rotation using `DATA_ENCRYPTION_KEYS_PREVIOUS`.

---

## 5. Rate Limiting & AI Spend Controls

- [ ] **Upstash Redis Provisioning**:
  - Create a production Upstash Redis database (Global or US-East).
  - Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel.
- [ ] **Enforce Spend Ceilings**:
  - Set `AI_DAILY_SPEND_CAP_USD="50.00"` (adjust per expected budget).
  - When the daily threshold is met, the system gracefully fails closed with HTTP 429 (`spend_capped`).

---

## 6. Private Rules Engine on Google Cloud Run

- [ ] **Cloud Run Engine Deployment**:
  - Service: `poa-engine` in Google Cloud project `concretepoa-ai` (region: `us-east1`).
  - Verify health check: `GET https://poa-engine-r44dfbj4ya-ue.a.run.app/healthz` returns `{"status":"ok"}`.
  - Service Account: `poa-api-caller@concretepoa-ai.iam.gserviceaccount.com`.
  - Set `POA_ENGINE_URL` in Vercel.
  - Verify Cloud Run CPU allocation is set to "request only" (scales to 0 when idle) to guarantee zero base cost.
  - Confirm GCP Budget Alert is active ($5.00/month cap).

---

## 7. Error & Performance Monitoring (Sentry Zero-PII)

- [ ] **Sentry Project Setup**:
  - Create a Sentry Next.js project.
  - Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in Vercel.
- [ ] **Zero-PII Compliance Confirmation**:
  - Confirm `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` are active.
  - Verify `beforeSend` sanitizes request bodies, deletes auth tokens and cookie headers, and removes any email/IP addresses.

---

## 8. Scheduled Automated Retention Purge

- [ ] **Vercel Cron Setup**:
  - Ensure `vercel.json` contains:
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/retention",
          "schedule": "0 3 * * *"
        }
      ]
    }
    ```
  - Generate a secure random string for `CRON_SECRET`:
    ```bash
    openssl rand -hex 32
    ```
  - Set `CRON_SECRET` in Vercel Environment Variables.
  - Verify automated invocation at 03:00 UTC deletes soft-deleted records past 30 days and enforces workspace retention limits.

---

## 9. Vercel Production Environment Variables Inventory

| Variable Name | Required | Environment | Type | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | All | Public | Clerk public key (`pk_live_...`) |
| `CLERK_SECRET_KEY` | Yes | Server | Secret | Clerk backend API key (`sk_live_...`) |
| `CLERK_WEBHOOK_SECRET` | Yes | Server | Secret | Svix webhook signature key (`whsec_...`) |
| `DATABASE_URL` | Yes | Server | Secret | Neon Postgres connection string with SSL |
| `DATA_ENCRYPTION_KEY` | Yes | Server | Secret | 32-byte base64 AES-256 master encryption key |
| `DATA_ENCRYPTION_KEY_ID` | Yes | Server | Secret | ID for the active encryption key |
| `AUDIT_HASH_SALT` | Yes | Server | Secret | Salt for HMAC pseudonymization of audit logs |
| `UPSTASH_REDIS_REST_URL` | Yes | Server | Secret | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Server | Secret | Upstash Redis access token |
| `ANTHROPIC_API_KEY` | Conditional | Server | Secret | Claude API key (if Claude is AI provider) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Conditional | Server | Secret | Gemini API key (if Gemini is AI provider) |
| `AI_PROVIDER` | No | Server | Config | `"google"`, `"anthropic"`, or `"poa-engine"` |
| `POA_ENGINE_URL` | Optional | Server | URL | Google Cloud Run rules engine URL |
| `AI_DAILY_SPEND_CAP_USD` | Yes | Server | Number | Daily AI spending limit (e.g. `50.00`) |
| `CRON_SECRET` | Yes | Server | Secret | Authorization token for Vercel Cron |
| `SENTRY_DSN` | Optional | Server | Secret | Sentry error reporting DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Public | Public | Sentry client DSN |
| `NEXT_PUBLIC_APP_URL` | Yes | Public | URL | Canonical app URL (`https://concretepoa.com`) |

---

## 10. Cutover & Promotion Steps

1. **Verify Quality Gates**:
   ```powershell
   npm run typecheck       # Must pass with 0 errors
   npm run lint            # Must pass with 0 warnings/errors
   npm run test            # Must pass 80/80 tests
   npm run build           # Must compile cleanly with Next.js Turbopack
   npm run scan:secrets    # Must report 0 secrets found
   ```
2. **Review Open PRs**:
   - Close obsolete PR #1 (`cursor/vite-remote-host-0260`).
   - Close obsolete PR #2 (`cursor/auth-tenant-login-0260`).
   - Open Pull Request from `release/v1` into `main`.
3. **Vercel Settings Verification**:
   - In Vercel Project Settings > General:
     - **Framework Preset**: `Next.js`
     - **Build Command**: `next build`
     - **Output Directory**: default (`.next`)
4. **Merge & Deploy**:
   - Merge `release/v1` into `main`.
   - Vercel automatically triggers production deployment.
5. **Post-Deploy Smoke Test**:
   - Check `curl -I https://concretepoa.com/api/health` returns HTTP 200 `{"status":"ok"}`.
   - Verify `/_next/static` is served and zero legacy Vite `/assets/index-*.js` scripts exist.
   - Log in via Clerk production OAuth.
   - Create a test matter, run audit pre-flight, and generate a time-limited share link.
   - Verify share link at `/r/[token]` with passcode unlock.

---

## 11. Rollback & Disaster Recovery Protocol

- **Instant Frontend Rollback**:
  - In Vercel Dashboard > Deployments, locate the last known good deployment and click **Instant Rollback**.
- **Database Point-In-Time Recovery (PITR)**:
  - In Neon Dashboard > Backups, select the restore point timestamp prior to incident and trigger branch restore.
- **Fail-Closed AI Safety**:
  - If AI providers experience degradation, the system fails closed with structured user-friendly HTTP 503 / 504 error messages. Zero partial or corrupted files are ever persisted.
