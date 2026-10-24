import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { logger } from "@/lib/log";

describe("lib/log structured logging and PII protection", () => {
  let loggedOutput: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    loggedOutput = [];
    console.log = (msg: string) => loggedOutput.push(msg);
    console.warn = (msg: string) => loggedOutput.push(msg);
    console.error = (msg: string) => loggedOutput.push(msg);
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });

  it("logs allowlisted telemetry fields as valid JSON", () => {
    logger.info({
      event: "analysis_completed",
      requestId: "req_123",
      durationMs: 450,
      statusCode: 200,
      provider: "anthropic",
      model: "claude-sonnet-4-5",
    });

    expect(loggedOutput.length).toBe(1);
    const parsed = JSON.parse(loggedOutput[0]);
    expect(parsed.event).toBe("analysis_completed");
    expect(parsed.requestId).toBe("req_123");
    expect(parsed.durationMs).toBe(450);
    expect(parsed.level).toBe("info");
    expect(parsed.timestamp).toBeDefined();
  });

  it("strictly strips non-allowlisted fields such as PII and raw document content", () => {
    // Attempt to log sensitive fields
    const payload = {
      event: "case_viewed",
      requestId: "req_abc",
      // Non-allowlisted / dangerous keys:
      principal: "John Doe",
      agent: "Jane Smith",
      documentText: "Full POA text with SSN 000-00-0000",
      fileName: "John_Doe_POA.pdf",
    };

    logger.info(payload as unknown as Parameters<typeof logger.info>[0]);

    expect(loggedOutput.length).toBe(1);
    const rawLogged = loggedOutput[0];
    expect(rawLogged).not.toContain("John Doe");
    expect(rawLogged).not.toContain("Jane Smith");
    expect(rawLogged).not.toContain("000-00-0000");
    expect(rawLogged).not.toContain("John_Doe_POA.pdf");

    const parsed = JSON.parse(rawLogged);
    expect(parsed.event).toBe("case_viewed");
    expect(parsed.requestId).toBe("req_abc");
    expect(parsed.principal).toBeUndefined();
    expect(parsed.documentText).toBeUndefined();
  });
});
