# ConcretePOA

Catch POA rejections before the bank does. ConcretePOA is a firm workspace for reviewing a power of attorney against an institution's intake rubric, a rejection letter, or a state's execution checklist. The logged-in app is the product: dashboard, case history, a findings report you can export, and a jurisdiction rule library.

## Features

- Clerk sign-in and organization workspaces. App routes and analysis APIs require a signed-in user.
- Case history in Postgres (Drizzle). If `DATABASE_URL` is missing, the same screens run on an in-memory store labeled **Demo data**.
- PDF or image upload. The server runs the existing audit, rejection, and jurisdiction prompts and saves a findings report with PDF and Markdown export.
- Jurisdiction and institution rule library, plus workspace-specific rules.
- Dashboard charts from the matters stored for the active organization.
- Seeded Harbor Elder Law demo matters.
- Model calls stay on the server. Inputs and model JSON are validated with zod. Each user is limited to 10 reviews a minute (Upstash when configured, otherwise an in-memory token bucket), with a hard token cap.

## Stack

Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn-style UI, Lucide, Framer Motion, Clerk, Drizzle ORM, Postgres, Recharts, Anthropic. Clerk runs in `proxy.ts` on the Node.js runtime so the session check is not compiled as an Edge Function.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in what you have. The app runs without Clerk keys in `next dev` (Clerk keyless mode) and without a database or model key.
3. `npm run dev`
4. Open the site, create a workspace, and load demo matters or upload a POA.

With Postgres:

```bash
npm run db:migrate
SEED_ORG_ID=org_your_clerk_org npm run db:seed
```

`SEED_ORG_ID` should be the Clerk organization id you want the demo rows attached to. The in-app **Load demo matters** button does the same for the active organization when the table is empty.

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key. **Rename** the existing Vercel value `VITE_CLERK_PUBLISHABLE_KEY` to this. The server still reads the Vite name as a fallback. |
| `CLERK_SECRET_KEY` | Unchanged from the current Vercel project. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional. The app already uses `/sign-in` and `/sign-up`. |
| `DATABASE_URL` | Postgres connection string (Neon or Supabase, including pooled URLs). |
| `SEED_ORG_ID` | Organization id used by `npm run db:seed`. |
| `ANTHROPIC_API_KEY` | Server-only. Required for a live review. |
| `AI_MODEL` | Optional. Defaults to `claude-sonnet-4-5`. |
| `AI_MAX_TOKENS` | Optional. Defaults to 4096 and is capped at 8192. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional shared rate limit. |
| `NEXT_PUBLIC_APP_URL` | Public origin for metadata. |
| `DEMO_SCREENSHOT` | Set to `1` only while capturing `/demo`. Do not set this in production. |

`GEMINI_API_KEY` is no longer read. The previous Vite config inlined it into the browser bundle. Rotate that key.

## What is live vs sample

- With `ANTHROPIC_API_KEY`, uploads are reviewed by Claude using the original audit, rejection, and jurisdiction instructions, including the institutional rubric and jurisdiction hints.
- Without that key, the API returns a clearly labeled sample report so the screens still demonstrate.
- Demo matters are synthetic files for Harbor Elder Law. They are not model output and they are not client results.
- Rule-library citations point at public statute chapters as review checkpoints. They are not quotations of a current statutory form.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck` / `npm run test:unit`
- `npm run db:migrate` / `npm run db:seed`
- `DEMO_SCREENSHOT=1 npm run dev`, then `npm run screenshot` (Playwright) to refresh `public/portfolio-screenshot.png` and `public/portfolio-screenshot-landing.png`.
