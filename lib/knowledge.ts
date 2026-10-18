import { BANK_REQUIREMENTS } from "@/lib/banks";

/** Curated prompt context. This is a review rubric, not legal advice. */
export const JURISDICTION_HINTS: Record<string, { topics: string[]; notes: string }> = {
  CA: {
    topics: [
      "Statutory short form vs custom long form",
      "Witness / notary rules depending on form type",
      "Springing vs immediate durability wording",
      "Agent duties and gifting / trust creation limitations where applicable",
    ],
    notes: "California has detailed POA statutes; compare execution block to current published court / bar guidance.",
  },
  NY: {
    topics: [
      "Statutory gifts rider if gifting beyond incidental gifts",
      "Separate banking / securities institutions may require specific powers enumerated",
      "Two disinterested witnesses for certain statutory forms",
    ],
    notes: "NY statutory short form and modifications are common friction points for broker-dealers.",
  },
  FL: {
    topics: [
      "Two witnesses + notary for durable POA execution (typical pattern)",
      "Specific super-powers (certain trust / beneficiary changes) if granted",
      "Agent acceptance / authority acknowledgment where used",
    ],
    notes: "Florida institutions often scrutinize witness count and notary block.",
  },
  TX: {
    topics: [
      "Statutory durable POA notices to principal",
      "Specific grants for real property vs financial accounts",
      "Recording when used for real estate",
    ],
    notes: "Texas durable POA notices are a common statutory drift vector.",
  },
  Generic: {
    topics: [
      "Identify governing law clause",
      "Principal / agent / successor naming clarity",
      "Durability language and effective date",
      "Notary + witness integrity",
    ],
    notes: "Use when state is unknown or document lists multiple jurisdictions.",
  },
};

export const FEW_SHOT_AUDIT_EXAMPLES = `
EXAMPLE A (illustrative — synthetic facts):
- Bank: Chase
- Finding: Durability present; missing explicit banking-transactions enumeration; notary block incomplete vs state pattern.
- Risk band: Medium
- Remediation: Amend or restate banking powers; obtain medallion / branch verification as required.

EXAMPLE B (illustrative — synthetic facts):
- Bank: Vanguard
- Finding: Third-party general POA; proprietary Vanguard form not used.
- Risk band: Low–Medium for acceptance probability at Vanguard; document may still be valid generally.
- Remediation: Complete Vanguard institutional POA or legal opinion per custodian request.

EXAMPLE C (illustrative — synthetic facts):
- Rejection letter keywords: "gifting," "third-party form," "stale"
- Mapping: Letter cites missing gifts rider while POA grants broad "all acts" — explain specificity gap.
`.trim();

export function bankRubricJson(): string {
  return JSON.stringify(BANK_REQUIREMENTS, null, 2);
}

export function jurisdictionHintsBlock(): string {
  return JSON.stringify(JURISDICTION_HINTS, null, 2);
}

export function auditKnowledgePreamble(targetBank: string): string {
  return `
KNOWLEDGE BASE (use for reasoning; cite gaps vs this rubric in clauseAudit):
Target institution this run: ${targetBank}

INSTITUTIONAL RUBRIC (JSON):
${bankRubricJson()}

FEW-SHOT REASONING STYLE (do not treat as facts about the user's document):
${FEW_SHOT_AUDIT_EXAMPLES}

RULES:
- Prefer quoting or paraphrasing language you see in the uploaded POA.
- When unsure, lower confidence and say what additional evidence would help (e.g., rider, affidavit, corporate resolution).
`.trim();
}

export function jurisdictionKnowledgePreamble(): string {
  return `
JURISDICTION KNOWLEDGE (state-level themes — verify against the document's governing law):
${jurisdictionHintsBlock()}

FEW-SHOT REASONING STYLE:
${FEW_SHOT_AUDIT_EXAMPLES}
`.trim();
}

export function rejectionKnowledgePreamble(): string {
  return `
INSTITUTIONAL RUBRIC (for mapping bank jargon to POA sections):
${bankRubricJson()}

Map rejection-letter phrases (gifting, third-party form, stale, indemnification, medallion, etc.) to concrete sections in the POA.
`.trim();
}
