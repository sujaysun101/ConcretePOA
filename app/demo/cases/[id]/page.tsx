import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseReport } from "@/components/case-report";
import { demoCases } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Findings" };

export default async function DemoCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = demoCases("org_demo_harbor").find((item) => item.id === id);
  if (!record) notFound();
  return <CaseReport record={record} basePath="/demo" />;
}
