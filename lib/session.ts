import "server-only";
import { auth } from "@clerk/nextjs/server";

export async function readSession() {
  const session = await auth();
  if (!session.userId) return null;
  return {
    userId: session.userId,
    orgId: session.orgId ?? null,
  };
}
