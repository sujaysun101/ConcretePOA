import type { AuditResult, CaseRecord, DashboardData, RejectionDiagnosis } from "@/lib/types";

function monthKey(iso: string) {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildDashboard(cases: CaseRecord[], mode: DashboardData["mode"]): DashboardData {
  const scores = cases.map((item) => item.score).filter((score): score is number => score !== null);
  const months = new Map<string, number[]>();
  const banks = new Map<string, number[]>();
  const states = new Map<string, number>();
  const hotspots = new Map<string, number>();

  for (const item of cases) {
    const bucket = months.get(monthKey(item.createdAt)) ?? [];
    if (item.score !== null) bucket.push(item.score);
    else bucket.push(Number.NaN);
    months.set(monthKey(item.createdAt), bucket);

    if (item.bankTarget) {
      const bankScores = banks.get(item.bankTarget) ?? [];
      if (item.score !== null) bankScores.push(item.score);
      banks.set(item.bankTarget, bankScores);
    }
    if (item.state) states.set(item.state, (states.get(item.state) ?? 0) + 1);

    if (item.kind === "audit") {
      const findings = item.findings as AuditResult;
      for (const flag of findings.primaryRedFlags ?? []) {
        const label = hotspotLabel(flag);
        hotspots.set(label, (hotspots.get(label) ?? 0) + 1);
      }
    }
    if (item.kind === "diagnosis") {
      const findings = item.findings as RejectionDiagnosis;
      const label = hotspotLabel(findings.rejectionReason);
      hotspots.set(label, (hotspots.get(label) ?? 0) + 1);
    }
  }

  const priority =
    [...cases].filter((item) => item.score !== null).sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0] ?? null;

  return {
    mode,
    totals: {
      cases: cases.length,
      audits: cases.filter((item) => item.kind === "audit").length,
      diagnoses: cases.filter((item) => item.kind === "diagnosis").length,
      jurisdiction: cases.filter((item) => item.kind === "jurisdiction").length,
      avgScore: average(scores),
      atRisk: cases.filter((item) => item.score !== null && item.score < 50).length,
    },
    byMonth: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, values]) => ({
        month: monthLabel(key),
        cases: values.length,
        avgScore: average(values.filter((value) => Number.isFinite(value))),
      })),
    byBank: [...banks.entries()]
      .map(([bank, values]) => ({ bank, cases: values.length, avgScore: average(values) }))
      .sort((a, b) => a.bank.localeCompare(b.bank)),
    byState: [...states.entries()]
      .map(([state, count]) => ({ state, cases: count }))
      .sort((a, b) => b.cases - a.cases),
    recent: [...cases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    priority,
    hotspots: [...hotspots.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

function hotspotLabel(text: string) {
  const value = text.toLowerCase();
  if (value.includes("gift")) return "Gift authority too general";
  if (value.includes("stale") || value.includes("older") || value.includes("years") || value.includes("re-execution")) return "Stale execution";
  if (value.includes("witness") || value.includes("notary")) return "Witness or notary gap";
  if (value.includes("proprietary") || value.includes("third-party") || value.includes("own form") || value.includes("own agent")) return "Third-party form";
  if (value.includes("indemn")) return "Missing indemnification";
  if (value.includes("successor")) return "Successor-agent proof";
  if (value.includes("affidavit") || value.includes("acceptance")) return "Missing agent affidavit";
  if (value.includes("initial")) return "Unreadable initials";
  if (value.includes("durab")) return "Durability wording";
  if (value.includes("super")) return "Superpower not specific";
  return "Other friction";
}
