import "server-only";
import { NextResponse } from "next/server";
import { requireWorkspace, forbidden } from "@/lib/api";
import { authorize } from "@/lib/authz";
import { listCases } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { session, response } = await requireWorkspace();
  if (!session) return response;

  const authz = authorize(session.scope, "case:read");
  if (!authz.ok) return forbidden(authz.reason);

  const workspaceId = session.orgId ?? session.userId;
  const allCases = await listCases(workspaceId);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim();
  const kind = searchParams.get("kind") || searchParams.get("mode");
  const bank = searchParams.get("bank")?.toLowerCase().trim();
  const state = searchParams.get("state")?.toLowerCase().trim();
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const filtered = allCases.filter((item) => {
    if (kind && kind !== "all" && item.kind !== kind) return false;
    if (bank && item.bankTarget?.toLowerCase() !== bank) return false;
    if (state && item.state?.toLowerCase() !== state) return false;
    if (q) {
      const haystack = `${item.title} ${item.summary} ${item.principal ?? ""} ${item.agent ?? ""} ${item.bankTarget ?? ""} ${item.state ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const page = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    cases: page,
    total: filtered.length,
    limit,
    offset,
  });
}
