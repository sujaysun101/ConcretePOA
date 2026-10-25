import "server-only";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { shareLinks } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { recordAuditEvent } from "@/lib/audit";
import { getCaseById } from "@/lib/store";
import type { CaseRecord } from "@/lib/types";

export interface CreateShareOptions {
  caseId: string;
  createdBy: string;
  expiresInDays?: number;
  passcode?: string;
  reqHeaders?: Headers;
}

export interface ShareLinkResult {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
  requiresPasscode: boolean;
}

export interface ShareViewResult {
  shareId: string;
  caseRecord: CaseRecord;
  requiresPasscode: boolean;
  isUnlocked: boolean;
}

// In-memory fallback
interface MemoryShare {
  id: string;
  caseId: string;
  tokenHash: string;
  createdBy: string;
  expiresAt: Date;
  revokedAt: Date | null;
  passcodeHash: string | null;
  viewCount: number;
  lastViewedAt: Date | null;
  createdAt: Date;
}

const globalMemory = globalThis as typeof globalThis & {
  __concretepoaShares?: MemoryShare[];
};

function memoryShares(): MemoryShare[] {
  if (!globalMemory.__concretepoaShares) {
    globalMemory.__concretepoaShares = [];
  }
  return globalMemory.__concretepoaShares;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPasscode(passcode: string): string {
  return crypto.scryptSync(passcode, "concretepoa_passcode_salt", 32).toString("hex");
}

function verifyPasscode(passcode: string, hash: string): boolean {
  try {
    const computed = crypto.scryptSync(passcode, "concretepoa_passcode_salt", 32).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Creates a public share link for a case.
 * Returns the plaintext single-use URL containing the token.
 */
export async function createShareLink(options: CreateShareOptions): Promise<ShareLinkResult> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const days = Math.min(30, Math.max(1, options.expiresInDays ?? 7));
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const passcodeHash = options.passcode?.trim() ? hashPasscode(options.passcode.trim()) : null;

  const db = getDb();
  let id: string = crypto.randomUUID();

  if (db) {
    const inserted = await db
      .insert(shareLinks)
      .values({
        caseId: options.caseId as `${string}-${string}-${string}-${string}-${string}`,
        tokenHash,
        createdBy: options.createdBy,
        expiresAt,
        passcodeHash,
      })
      .returning({ id: shareLinks.id });

    if (inserted[0]?.id) {
      id = inserted[0].id;
    }
  } else {
    memoryShares().push({
      id,
      caseId: options.caseId,
      tokenHash,
      createdBy: options.createdBy,
      expiresAt,
      revokedAt: null,
      passcodeHash,
      viewCount: 0,
      lastViewedAt: null,
      createdAt: new Date(),
    });
  }

  await recordAuditEvent({
    actorUserId: options.createdBy,
    actorType: "user",
    scopeType: "personal",
    action: "case.share_create",
    targetType: "share_link",
    targetId: id,
    metadata: {
      caseId: options.caseId,
      expiresInDays: days,
      hasPasscode: Boolean(passcodeHash),
    },
    reqHeaders: options.reqHeaders,
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return {
    id,
    token,
    url: `${appUrl}/r/${token}`,
    expiresAt: expiresAt.toISOString(),
    requiresPasscode: Boolean(passcodeHash),
  };
}

/**
 * Resolves a share token and returns the case data.
 */
export async function resolveShareToken(
  token: string,
  passcode?: string,
  reqHeaders?: Headers
): Promise<ShareViewResult | null> {
  const tokenHash = hashToken(token);
  const now = new Date();
  const db = getDb();

  let share: {
    id: string;
    caseId: string;
    passcodeHash: string | null;
    expiresAt: Date;
    viewCount: number;
  } | null = null;

  if (db) {
    const rows = await db
      .select({
        id: shareLinks.id,
        caseId: shareLinks.caseId,
        passcodeHash: shareLinks.passcodeHash,
        expiresAt: shareLinks.expiresAt,
        viewCount: shareLinks.viewCount,
      })
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.tokenHash, tokenHash),
          isNull(shareLinks.revokedAt),
          gt(shareLinks.expiresAt, now)
        )
      )
      .limit(1);

    if (rows[0]) {
      share = rows[0];
      // Increment view count & last viewed
      await db
        .update(shareLinks)
        .set({
          viewCount: share.viewCount + 1,
          lastViewedAt: now,
        })
        .where(eq(shareLinks.id, share.id));
    }
  } else {
    const found = memoryShares().find(
      (s) => s.tokenHash === tokenHash && !s.revokedAt && s.expiresAt > now
    );
    if (found) {
      found.viewCount++;
      found.lastViewedAt = now;
      share = found;
    }
  }

  if (!share) return null;

  const requiresPasscode = Boolean(share.passcodeHash);
  let isUnlocked = !requiresPasscode;

  if (requiresPasscode && passcode) {
    isUnlocked = verifyPasscode(passcode, share.passcodeHash!);
  }

  // Load case record
  const caseRecord = await getCaseById(share.caseId);
  if (!caseRecord) return null;

  await recordAuditEvent({
    actorType: "share_link",
    scopeType: "personal",
    action: "case.share_view",
    targetType: "share_link",
    targetId: share.id,
    metadata: {
      caseId: share.caseId,
      isUnlocked,
    },
    reqHeaders,
  });

  return {
    shareId: share.id,
    caseRecord,
    requiresPasscode,
    isUnlocked,
  };
}

/**
 * Revokes a share link immediately.
 */
export async function revokeShareLink(shareId: string, actorUserId: string): Promise<boolean> {
  const db = getDb();
  const now = new Date();

  if (db) {
    await db
      .update(shareLinks)
      .set({ revokedAt: now })
      .where(eq(shareLinks.id, shareId));
  } else {
    const found = memoryShares().find((s) => s.id === shareId);
    if (found) {
      found.revokedAt = now;
    }
  }

  await recordAuditEvent({
    actorUserId,
    actorType: "user",
    scopeType: "personal",
    action: "case.share_revoke",
    targetType: "share_link",
    targetId: shareId,
  });

  return true;
}
