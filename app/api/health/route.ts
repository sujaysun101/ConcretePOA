import { NextResponse } from "next/server";
import { dataMode } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    storage: dataMode(),
    service: "concretepoa-api",
  });
}
