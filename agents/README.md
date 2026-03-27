# Agent SDKs (optional next step)

## Already in this app

- **`@google/genai`** — direct Gemini calls with JSON schema (what `src/services/gemini.ts` uses). This is appropriate for a single-document audit flow.

## Google Agent Development Kit (ADK)

Google’s **Agent Development Kit** (`@google/adk`) is aimed at multi-step agents, tools, and orchestration outside a simple Vite UI. Docs: https://google.github.io/adk-docs/

Install when you want a separate agent service (e.g. Node server with tools):

```bash
npm install @google/adk
```

Requirements are listed in the official docs (Node/npm versions change; check the site before installing).

Suggested layout if you adopt ADK:

- Keep the **React app** as the client.
- Add a **small Node API** (or serverless functions) that runs ADK agents for long-running / multi-tool workflows.
- Pass only non-secret session data to the browser; keep API keys on the server.

This repo does not bundle ADK by default to avoid version skew with the Vite frontend and to keep install size smaller.
