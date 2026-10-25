import { describe, expect, it } from "vitest";
import { MockProvider, getProvider } from "@/lib/ai/provider";

describe("AI Providers (lib/ai/provider.ts)", () => {
  it("MockProvider returns schema-compliant responses for all modes", async () => {
    const provider = new MockProvider();

    // Mode: audit
    const auditRes = await provider.complete({
      mode: "audit",
      prompt: "test audit prompt",
      poa: {
        name: "test.pdf",
        mimeType: "application/pdf",
        base64: "JVBERi0xLjQK...",
      },
      bank: "Chase",
    });
    expect(auditRes.provider).toBe("mock");
    expect(JSON.parse(auditRes.rawText)).toHaveProperty("acceptanceProbability");

    // Mode: diagnosis
    const diagRes = await provider.complete({
      mode: "diagnosis",
      prompt: "test diag prompt",
      poa: {
        name: "test.pdf",
        mimeType: "application/pdf",
        base64: "JVBERi0xLjQK...",
      },
    });
    expect(JSON.parse(diagRes.rawText)).toHaveProperty("rejectionReason");

    // Mode: jurisdiction
    const jurisRes = await provider.complete({
      mode: "jurisdiction",
      prompt: "test juris prompt",
      poa: {
        name: "test.pdf",
        mimeType: "application/pdf",
        base64: "JVBERi0xLjQK...",
      },
    });
    expect(JSON.parse(jurisRes.rawText)).toHaveProperty("overallComplianceScore");
  });

  it("getProvider resolves override and defaults appropriately", () => {
    const mockProvider = getProvider("mock");
    expect(mockProvider.name).toBe("mock");
  });
});
