import type { Metadata } from "next";
import { CaseList } from "@/components/case-list";
import { demoCases } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Matters" };

export default function DemoCasesPage() {
  return <CaseList cases={demoCases("org_demo_harbor")} basePath="/demo" />;
}
