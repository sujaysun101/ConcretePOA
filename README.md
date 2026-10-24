# ConcretePOA

> An AI "pre-flight" compliance and friction audit platform for Power of Attorney (POA) legal documents. ConcretePOA evaluates POAs against institutional intake rubrics, translates bank rejection letters into actionable remediation plans, and tracks statutory execution drift across jurisdictions.

---

## ⚠️ Important Legal Disclaimer

**ConcretePOA is an informational review aid, not a law firm, and does not provide legal advice.** All output, friction assessments, and remediation documents are draft templates that must be reviewed and executed under the advice of a licensed attorney in the relevant jurisdiction.

---

## Architecture & Technology Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4, Lucide Icons, Framer Motion
- **Authentication & Authorization:** Clerk (Personal Workspaces, Organizations, Role-Based Access Control)
- **Database & ORM:** PostgreSQL (Neon / Supabase), Drizzle ORM
- **AI Core:** Provider abstraction layer supporting Anthropic Claude (`claude-sonnet-4-5`) and Google Gemini, with server-side execution only and structured JSON output validation via Zod
- **Rate Limiting & Cost Metering:** Upstash Redis with token-bucket sliding windows and daily spend ceiling
- **Security & Privacy:**
  - Zero client-side API keys or secrets
  - Pre-commit and CI automated secret scanners for source code and `.next/static` bundles
  - Strict PII-redacted structured JSON logging
  - Fail-closed production configuration (`lib/env.ts`)
  - HTTP Security Headers (CSP, HSTS, X-Content-Type-Options, Permissions-Policy, X-Frame-Options)

---

## Local Development Setup

### 1. Prerequisites
- Node.js 22+
- npm 10+
- Optional: PostgreSQL connection string or local Postgres instance

### 2. Installation
```bash
git clone https://github.com/sujaysun101/ConcretePOA.git
cd ConcretePOA
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```
*(In local development without `DATABASE_URL` or `ANTHROPIC_API_KEY`, the application automatically operates in demo sample mode with mock data).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quality Assurance & Verification

ConcretePOA enforces strict quality controls across every build:

```bash
# Type check TypeScript in strict mode
npm run typecheck

# Run ESLint with zero-warning tolerance
npm run lint

# Run unit tests and regression suite with coverage
npm run test:coverage

# Scan codebase and built client assets for secret leaks
npm run scan:secrets

# Production Next.js build
npm run build
```

---

## Environment Variables Reference

| Variable | Description | Production Requirement |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for client authentication | **Required** |
| `CLERK_SECRET_KEY` | Server-side Clerk API authentication key | **Required** |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Secret to verify incoming Clerk webhooks | **Required in Phase 2** |
| `DATABASE_URL` | Pooled Postgres connection URL | **Required in Production** |
| `DATABASE_URL_MIGRATIONS` | Direct unpooled Postgres connection URL for migrations | **Required in Phase 3** |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL for distributed rate limiting | **Required in Production** |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | **Required in Production** |
| `AI_PROVIDER` | AI provider selector (`anthropic` or `google`) | Optional (Default: `anthropic`) |
| `ANTHROPIC_API_KEY` | Server-only API key for Anthropic Claude | Required if `AI_PROVIDER=anthropic` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server-only API key for Google Gemini | Required if `AI_PROVIDER=google` |
| `AI_DAILY_SPEND_CAP_USD` | System daily spending ceiling in USD | Optional (Default: `25`) |
| `DATA_ENCRYPTION_KEY` | 32-byte base64 AES-256 key for PII field encryption | **Required in Phase 3** |
| `AUDIT_HASH_SALT` | Salt for hashing IPs and user-agents in audit logs | **Required in Phase 3** |
| `CRON_SECRET` | Vercel Cron header authorization secret | **Required in Phase 3** |
| `DEMO_SCREENSHOT` | Set to 1 only in local dev for screenshot generation | **Strictly Prohibited in Prod** |

---

## Deployment & Production Runbook

1. **Verify Secrets & Environment:** Ensure all production environment variables are configured in the Vercel Project Settings.
2. **Build Verification:** Run `npm run typecheck && npm run lint && npm run test && npm run scan:secrets` in CI.
3. **Database Migration:** Apply database schema migrations using `npm run db:migrate`.
4. **Promotion:** Promote the Next.js deployment. Confirm `https://concrete-poa.vercel.app/api/health` returns HTTP 200 OK.
