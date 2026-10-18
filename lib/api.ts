import "server-only";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export async function requireWorkspace() {
  const session = await readSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (!session.orgId) {
    return { session: null, response: NextResponse.json({ error: "Choose a workspace before continuing." }, { status: 400 }) };
  }
  return { session: { userId: session.userId, orgId: session.orgId }, response: null };
}

export function badRequest(error: string, status = 400, extra?: Record<string, string | number>) {
  return NextResponse.json({ error, ...extra }, { status });
}
