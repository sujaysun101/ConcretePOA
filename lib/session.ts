import "server-only";
import { auth } from "@clerk/nextjs/server";

export async function readSession() {
  try {
    const session = await auth();
    if (!session?.userId) return null;

    const claims = session.sessionClaims as Record<string, unknown> | undefined;
    const platformRole = (claims?.platformRole as string) ?? (claims?.metadata as Record<string, unknown>)?.platformRole ?? null;
    const twoFactorEnabled = Boolean(claims?.mfa ?? claims?.two_factor_enabled);

    return {
      userId: session.userId,
      orgId: session.orgId ?? null,
      orgRole: session.orgRole ?? null,
      platformRole: platformRole === "admin" ? ("admin" as const) : null,
      twoFactorEnabled,
    };
  } catch (error) {
    console.warn("Failed to read Clerk session (stale or invalid cookie):", error);
    return null;
  }
}
