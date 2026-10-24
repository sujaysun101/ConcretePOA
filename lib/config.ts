import "server-only";
import { isProduction, validateProductionConfig } from "@/lib/env";

export function clerkPublishableKey() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;
  return key?.trim() || undefined;
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function aiModelName() {
  return process.env.AI_MODEL?.trim() || "claude-sonnet-4-5";
}

export function dataMode(): "postgres" | "memory" {
  if (isProduction()) {
    validateProductionConfig();
    return "postgres";
  }
  return process.env.DATABASE_URL?.trim() ? "postgres" : "memory";
}

export function maxTokens() {
  const raw = Number(process.env.AI_MAX_TOKENS ?? 4096);
  if (!Number.isFinite(raw)) return 4096;
  return Math.min(8192, Math.max(256, Math.floor(raw)));
}
