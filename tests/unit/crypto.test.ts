import { describe, expect, it } from "vitest";
import { encryptField, decryptField, hashAuditValue } from "@/lib/crypto";

describe("Application-Level Field Encryption (AES-256-GCM)", () => {
  it("encrypts and decrypts round-trip correctly", () => {
    const original = "Jane Doe";
    const encrypted = encryptField(original);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(original);
    expect(encrypted?.startsWith("v1:")).toBe(true);

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(original);
  });

  it("handles null and undefined gracefully", () => {
    expect(encryptField(null)).toBeNull();
    expect(encryptField(undefined)).toBeNull();
    expect(encryptField("")).toBeNull();

    expect(decryptField(null)).toBeNull();
    expect(decryptField(undefined)).toBeNull();
  });

  it("supports large JSON text blobs (e.g. findings payload)", () => {
    const findingsObj = {
      id: "case-123",
      score: 95,
      nested: { redFlags: ["Flag 1", "Flag 2"] },
      longString: "A".repeat(5000),
    };
    const jsonStr = JSON.stringify(findingsObj);
    const encrypted = encryptField(jsonStr);
    expect(encrypted).toBeDefined();

    const decrypted = decryptField(encrypted);
    expect(decrypted).toBe(jsonStr);
    expect(JSON.parse(decrypted!)).toEqual(findingsObj);
  });

  it("produces deterministic HMAC audit hashes", () => {
    const ip = "192.168.1.100";
    const hash1 = hashAuditValue(ip);
    const hash2 = hashAuditValue(ip);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(ip);
    expect(hashAuditValue(null)).toBeNull();
  });
});
