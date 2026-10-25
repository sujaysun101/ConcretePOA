import { BANK_REQUIREMENTS } from "@/lib/banks";

/** Curated prompt context. This is a review rubric, not legal advice. */
export const JURISDICTION_HINTS: Record<
  string,
  {
    name: string;
    topics: string[];
    notes: string;
    effectiveAsOf: string;
    statuteCitation: string;
    reviewStatus: "attorney_reviewed" | "unverified";
  }
> = {
  CA: {
    name: "California",
    topics: [
      "Statutory form vs attorney custom draft under Cal. Prob. Code § 4401",
      "Witness / notary rules: either 2 adult witnesses or acknowledgment before a notary public",
      "Springing vs immediate durability wording under § 4124",
      "Limitations on gifting and trust creation without express statutory authority (§ 4264)",
    ],
    notes: "California has detailed POA statutes; compare execution block to current published probate code.",
    effectiveAsOf: "2026-01-01",
    statuteCitation: "Cal. Prob. Code §§ 4000-4545",
    reviewStatus: "unverified",
  },
  NY: {
    name: "New York",
    topics: [
      "General Obligations Law § 5-1501B execution requirements: signed, dated, notarized, and witnessed by 2 adult witnesses not named as agents",
      "Statutory gifts and hot powers under § 5-1514 (substantial gifts require express modifications or rider)",
      "Agent acceptance and signature requirement prior to exercising authority (§ 5-1501B(2)(a))",
      "Mandatory 'Caution to the Principal' notice wording (§ 5-1513)",
    ],
    notes: "NY statutory short form rules updated under 2021 reform; strict adherence required by financial institutions.",
    effectiveAsOf: "2026-01-01",
    statuteCitation: "N.Y. Gen. Oblig. Law §§ 5-1501 to 5-1514",
    reviewStatus: "attorney_reviewed",
  },
  FL: {
    name: "Florida",
    topics: [
      "Execution formalities: Fla. Stat. § 709.2105 requires signature before 2 subscribing witnesses AND notary acknowledgment",
      "Specific 'Superpowers' under § 709.2202 (trust creation, beneficiary designation, gifting) require separate initials or express signed grant",
      "Immediate effectiveness: springing POAs prohibited under Florida law since October 1, 2011 (except military)",
      "Third-party acceptance rules under § 709.2120",
    ],
    notes: "Florida institutions heavily scrutinize witness signatures, notary seal, and superpower initials.",
    effectiveAsOf: "2026-01-01",
    statuteCitation: "Fla. Stat. §§ 709.2101-709.2402",
    reviewStatus: "unverified",
  },
  TX: {
    name: "Texas",
    topics: [
      "Statutory Durable Power of Attorney Act under Tex. Est. Code Ann. § 751",
      "Mandatory Notice to Principal and Information for Agent under § 752.051",
      "Immediate vs springing upon incapacity designation (§ 751.0021)",
      "Express authority for hot powers / gifts (§ 751.031)",
      "Mandatory acceptance rules for financial institutions under § 751.201",
    ],
    notes: "Texas requires specific statutory disclosure language; third parties face statutory penalties for refusal.",
    effectiveAsOf: "2026-01-01",
    statuteCitation: "Tex. Estates Code §§ 751.001-752.152",
    reviewStatus: "unverified",
  },
  UPOAA: {
    name: "Uniform Power of Attorney Act (Model)",
    topics: [
      "Default durability unless document expressly provides for termination upon incapacity (§ 104)",
      "Hot powers (§ 201) require express grant: creating/amending living trusts, gifting, beneficiary designations, survivorship rights",
      "Agent duties and fiduciary standards under § 114",
      "Statutory protections for third parties and mandatory acceptance timeframes (§§ 119-120)",
    ],
    notes: "Adopted by 30+ states with minor local adaptations. Serves as baseline for multi-state uniform evaluation.",
    effectiveAsOf: "2026-01-01",
    statuteCitation: "Uniform Power of Attorney Act (2006/2021 revisions)",
    reviewStatus: "unverified",
  },
  Generic: {
    name: "Multi-jurisdiction Baseline",
    topics: [
      "Identify governing law and state jurisdiction clause",
      "Principal / agent / successor naming clarity",
      "Durability language and effective date",
      "Notary + witness integrity",
    ],
    notes: "Use when state is unknown or document lists multiple jurisdictions.",
    effectiveAsOf: "2026-01-01",
    statuteCitation: "Common Law & Uniform Statutory Principles",
    reviewStatus: "unverified",
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
REJECTION DIAGNOSIS KNOWLEDGE:
Institutional policies frequently reject general POAs for lack of explicit enumeration (e.g., banking powers, gifting, beneficiary designations).
Always tie rejection reasons back to the specific statutory or institutional requirements.
`.trim();
}
