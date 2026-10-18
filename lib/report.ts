import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AuditResult, CaseRecord, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";

export function caseToMarkdown(record: CaseRecord) {
  const lines = [
    `# ${record.title}`,
    "",
    `Kind: ${record.kind}`,
    `Created: ${record.createdAt}`,
    record.score !== null ? `Score: ${record.score}` : "",
    "",
    record.summary,
    "",
    "This export is an informational review aid. It is not legal advice.",
    "",
  ];
  if (record.kind === "audit") {
    const findings = record.findings as AuditResult;
    lines.push("## Red flags", ...findings.primaryRedFlags.map((item) => `- ${item}`), "");
    lines.push("## Clause audit", ...findings.clauseAudit.map((item) => `- ${item}`), "");
    lines.push("## Execution audit", ...findings.executionAudit.map((item) => `- ${item}`), "");
    lines.push("## Concrete fix", findings.remediationBlueprint.concreteFix, "");
    lines.push("## Affidavit", findings.remediationBlueprint.affidavitTemplate);
  } else if (record.kind === "diagnosis") {
    const findings = record.findings as RejectionDiagnosis;
    lines.push("## What the letter says", findings.rejectionReason, "");
    lines.push("## Plain-language translation", findings.legaleseTranslation, "");
    lines.push("## Where the POA conflicts", findings.poaConflictSection, "");
    lines.push("## Action plan", `1. ${findings.actionPlan.step1}`, `2. ${findings.actionPlan.step2}`, `3. ${findings.actionPlan.step3}`, "");
    lines.push("## Remediation", findings.remediationText);
  } else {
    const findings = record.findings as JurisdictionResult;
    lines.push(`## ${findings.state} · ${findings.statutoryYear}`, "");
    lines.push("### Caution to the principal", findings.cautionSectionVerbatim.driftDetails, "");
    lines.push("### Agent signature page", findings.agentSignaturePage.driftDetails, "");
    lines.push(
      "## Drift",
      ...findings.statutoryDrift.map((item) => `- (${item.severity}) ${item.title}: ${item.description} Remediation: ${item.remediation}`),
    );
  }
  return lines.filter((line) => line !== undefined).join("\n");
}

export async function caseToPdf(record: CaseRecord) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 48;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxWidth = pageWidth - margin * 2;
  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensure = (height: number) => {
    if (y - height < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const write = (text: string, options?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
    const size = options?.size ?? 11;
    const face = options?.bold ? bold : font;
    const color = options?.color ?? [0.11, 0.14, 0.19];
    const words = text.split(/\s+/);
    let line = "";
    const flush = (value: string) => {
      ensure(size + 6);
      page.drawText(value, { x: margin, y, size, font: face, color: rgb(color[0], color[1], color[2]) });
      y -= size + 5;
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (face.widthOfTextAtSize(next, size) > maxWidth && line) {
        flush(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) flush(line);
  };

  write("ConcretePOA findings report", { size: 18, bold: true });
  write(record.title, { size: 14, bold: true, color: [0.6, 0.3, 0.17] });
  y -= 6;
  write(
    [record.kind, record.principal, record.bankTarget, record.state, record.score !== null ? `Score ${record.score}` : ""]
      .filter(Boolean)
      .join("  ·  "),
    { size: 10, color: [0.36, 0.4, 0.45] },
  );
  y -= 8;
  write(record.summary);
  y -= 8;

  const blocks = caseToMarkdown(record)
    .split("\n")
    .filter((line) => !line.startsWith("# ") && line !== record.summary);
  for (const line of blocks) {
    if (!line.trim()) {
      y -= 6;
      continue;
    }
    if (line.startsWith("## ")) write(line.replace(/^##\s+/, ""), { size: 13, bold: true });
    else if (line.startsWith("### ")) write(line.replace(/^###\s+/, ""), { size: 12, bold: true });
    else write(line, { size: 10 });
  }

  y -= 12;
  write("Informational review aid. Not legal advice. Confirm current statutes and the institution's live checklist before acting.", {
    size: 8,
    color: [0.4, 0.4, 0.4],
  });

  return doc.save();
}
