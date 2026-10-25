import { describe, expect, it } from "vitest";
import {
  estimateCostUsd,
  assertUnderSpendCeiling,
  recordUsageEvent,
} from "@/lib/ai/usage";
import { SpendCappedError } from "@/lib/errors";

describe("AI Usage Metering & Spend Ceiling (lib/ai/usage.ts)", () => {
  it("estimates costs correctly for different providers and token counts", () => {
    // Mock and poa-engine are zero cost
    expect(estimateCostUsd("mock", "mock-v1", 1000, 1000)).toBe(0);
    expect(estimateCostUsd("poa-engine", "poa-engine-rules", 1000, 1000)).toBe(0);

    // Anthropic: $3/M in, $15/M out
    const anthropicCost = estimateCostUsd("anthropic", "claude-sonnet-4-5", 10_000, 2_000);
    expect(anthropicCost).toBeCloseTo(0.06, 3); // 10k * 3/1M = 0.03, 2k * 15/1M = 0.03 -> total 0.06

    // Google: $0.5/M in, $1.5/M out
    const googleCost = estimateCostUsd("google", "gemini-2.5-flash", 10_000, 2_000);
    expect(googleCost).toBeCloseTo(0.008, 3);
  });

  it("passes under spend ceiling when within budget", async () => {
    await expect(assertUnderSpendCeiling(0.05)).resolves.toBeUndefined();
  });

  it("enforces spend ceiling when budget exceeded", async () => {
    // Temporarily lower budget or pass massive cost
    await expect(assertUnderSpendCeiling(999.0)).rejects.toThrow(SpendCappedError);
  });

  it("records usage events safely", async () => {
    await expect(
      recordUsageEvent({
        userId: "test_user_1",
        orgId: "test_org_1",
        mode: "audit",
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        inputTokens: 1500,
        outputTokens: 400,
        latencyMs: 1250,
        outcome: "ok",
        attempts: 1,
      })
    ).resolves.toBeUndefined();
  });
});
