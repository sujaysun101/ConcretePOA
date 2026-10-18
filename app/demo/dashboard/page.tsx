import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import { demoCases } from "@/lib/demo-data";
import { buildDashboard } from "@/lib/metrics";

export const metadata: Metadata = { title: "Dashboard" };

export default function DemoDashboardPage() {
  const data = buildDashboard(demoCases("org_demo_harbor"), "memory");
  return <DashboardView data={data} basePath="/demo" />;
}
