import { NextResponse } from "next/server";
import { dataMode } from "@/lib/config";
import { databaseUrl, getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = dataMode();
  let dbHealthy = true;

  if (databaseUrl()) {
    try {
      const sql = getSql();
      if (sql) {
        await sql`SELECT 1`;
      }
    } catch {
      dbHealthy = false;
    }
  }

  if (!dbHealthy) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        storage: mode,
        service: "concretepoa-api",
        error: "database_unreachable",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    storage: mode,
    service: "concretepoa-api",
  });
}
