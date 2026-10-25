import "server-only";
import crypto from "node:crypto";
import { AppError } from "@/lib/errors";

const ENVELOPE_PREFIX = "v1";

function getActiveKey(): { keyId: string; keyBuffer: Buffer } {
  const keyBase64 = process.env.DATA_ENCRYPTION_KEY?.trim();
  const keyId = process.env.DATA_ENCRYPTION_KEY_ID?.trim() || "k1";

  if (!keyBase64) {
    // If not in production, use a consistent 32-byte deterministic fallback key for testing/dev
    if (process.env.NODE_ENV !== "production") {
      return {
        keyId: "dev-k1",
        keyBuffer: Buffer.from("01234567890123456789012345678901", "utf-8"),
      };
    }
    throw new AppError({
      message: "DATA_ENCRYPTION_KEY is required in production.",
      statusCode: 500,
      code: "internal_error",
    });
  }

  const keyBuffer = Buffer.from(keyBase64, "base64");
  if (keyBuffer.length !== 32) {
    throw new AppError({
      message: "DATA_ENCRYPTION_KEY must be a valid 32-byte base64-encoded string.",
      statusCode: 500,
      code: "internal_error",
    });
  }

  return { keyId, keyBuffer };
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format envelope: `v1:<keyId>:<iv_b64>:<authTag_b64>:<ciphertext_b64>`
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === "") {
    return null;
  }

  const { keyId, keyBuffer } = getActiveKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    ENVELOPE_PREFIX,
    keyId,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypts an envelope-formatted string: `v1:<keyId>:<iv_b64>:<authTag_b64>:<ciphertext_b64>`.
 * Returns plaintext or null.
 */
export function decryptField(envelope: string | null | undefined): string | null {
  if (!envelope) return null;

  // If data is somehow already plaintext (e.g. pre-migration or fallback), check format
  const parts = envelope.split(":");
  if (parts.length !== 5 || parts[0] !== ENVELOPE_PREFIX) {
    // Unencrypted legacy fallback
    return envelope;
  }

  const [, keyId, ivB64, authTagB64, cipherB64] = parts;
  const active = getActiveKey();

  let keyBuffer = active.keyBuffer;
  if (keyId !== active.keyId) {
    // Support key rotation if legacy key var configured
    const altKeyBase64 = process.env[`DATA_ENCRYPTION_KEY_${keyId.toUpperCase()}`]?.trim();
    if (altKeyBase64) {
      keyBuffer = Buffer.from(altKeyBase64, "base64");
    }
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf-8");
  } catch {
    throw new AppError({
      message: "Failed to decrypt encrypted payload. Key or tag mismatch.",
      statusCode: 500,
      code: "internal_error",
    });
  }
}

/**
 * Deterministic pseudonymized HMAC-SHA256 for audit and lookup hashing.
 */
export function hashAuditValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const salt = process.env.AUDIT_HASH_SALT?.trim() || "concretepoa-default-salt";
  return crypto.createHmac("sha256", salt).update(value).digest("hex");
}
