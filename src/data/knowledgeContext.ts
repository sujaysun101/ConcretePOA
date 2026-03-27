import {
  bankRubricJson,
  FEW_SHOT_AUDIT_EXAMPLES,
  jurisdictionHintsBlock,
} from './auditKnowledgeBase';

/** Prepended to audit prompts so the model aligns with institutional rubric + few-shot reasoning style. */
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
