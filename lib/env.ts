import "server-only";

export type AppEnvironment = "production" | "preview" | "development" | "test";

export function getAppEnvironment(): AppEnvironment {
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }
  if (process.env.VERCEL_ENV === "preview") {
    return "preview";
  }
  if (process.env.NODE_ENV === "test") {
    return "test";
  }
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return "development";
}

export function isProduction(): boolean {
  return getAppEnvironment() === "production";
}

export function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

export function validateProductionConfig(): void {
  const isProd = isProduction();

  // Strict check on DEMO_SCREENSHOT in production
  if (isProd && process.env.DEMO_SCREENSHOT === "1") {
    throw new Error(
      "SECURITY_VIOLATION: DEMO_SCREENSHOT=1 is strictly forbidden in production environments."
    );
  }

  // Strict check on DATABASE_URL in production (skip during build phase if not set)
  if (isProd && !isBuildPhase() && !process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "CONFIGURATION_ERROR: DATABASE_URL is missing. In-memory data fallback is prohibited in production."
    );
  }

  // Strict check on Upstash rate limiter in production (skip during build phase)
  if (isProd && !isBuildPhase()) {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (!redisUrl || !redisToken) {
      throw new Error(
        "CONFIGURATION_ERROR: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production to enforce distributed rate limits."
      );
    }
  }
}

// Auto-run validation if in production and not in build phase
if (isProduction() && !isBuildPhase()) {
  validateProductionConfig();
}
