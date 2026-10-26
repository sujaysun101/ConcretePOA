import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAppEnvironment, isProduction, validateProductionConfig } from "@/lib/env";

describe("lib/env fail-closed configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("identifies production environment correctly", () => {
    process.env.VERCEL_ENV = "production";
    expect(isProduction()).toBe(true);
    expect(getAppEnvironment()).toBe("production");

    delete process.env.VERCEL_ENV;
    Object.assign(process.env, { NODE_ENV: "test" });
    expect(isProduction()).toBe(false);
  });

  it("throws in production when DATABASE_URL is missing", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.DATABASE_URL;

    expect(() => validateProductionConfig()).toThrow(
      /DATABASE_URL is missing/
    );
  });

  it("throws in production when DEMO_SCREENSHOT is set to 1", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.upstash.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    process.env.DEMO_SCREENSHOT = "1";

    expect(() => validateProductionConfig()).toThrow(
      /DEMO_SCREENSHOT=1 is strictly forbidden/
    );
  });

  it("throws in production when Upstash Redis is missing and REQUIRE_UPSTASH_RATE_LIMIT is set", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    process.env.REQUIRE_UPSTASH_RATE_LIMIT = "1";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DEMO_SCREENSHOT;

    expect(() => validateProductionConfig()).toThrow(
      /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production/
    );
  });

  it("warns and falls back gracefully in production when Upstash Redis is missing without strict flag", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    delete process.env.REQUIRE_UPSTASH_RATE_LIMIT;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DEMO_SCREENSHOT;

    expect(() => validateProductionConfig()).not.toThrow();
  });

  it("passes validation in production when all required variables are set", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.upstash.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    delete process.env.DEMO_SCREENSHOT;

    expect(() => validateProductionConfig()).not.toThrow();
  });
});
