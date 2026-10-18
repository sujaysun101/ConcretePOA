import {
  auditKnowledgePreamble,
  jurisdictionKnowledgePreamble,
  rejectionKnowledgePreamble,
} from "@/lib/knowledge";

export function auditPrompt(targetBank: string, customRules?: string) {
  return `
    ${auditKnowledgePreamble(targetBank)}

    You are a Senior Banking Compliance Auditor & Elder Law Technical Specialist for "ConcretePOA".
    Analyze the provided Power of Attorney (POA) document against the requirements for ${targetBank}.
    
    ${customRules ? `ADDITIONAL CUSTOM RULES TO AUDIT AGAINST: "${customRules}"` : ""}

    OPERATIONAL PROTOCOLS:
    1. Document Deconstruction (OCR-to-Logic):
       - Extract the full raw text of the document.
       - Identify Principal, Agent, State of Execution, and Execution Date.
       - Jurisdictional Nexus: Which state's law governs?
       - Execution Date: Is it stale (>5-10 years)?
       - Authority Granularity: Does it grant "Super Powers" (changing beneficiaries, gifting, creating trusts)?
       - Notary Integrity: Does the notary block match statutory language?
    
    2. Institutional Matching (${targetBank}):
       - Fidelity/Schwab: Specific "Indemnification of Agent" clauses.
       - Chase/BofA: "Durability Clause" required.
       - Vanguard: Proprietary forms often needed.
       - General: Highest common denominator of strictness if specific rule unknown.
    
    3. Risk Assessment:
       - High (85-100%): Meets state law and known internal bank policies.
       - Medium (50-85%): Legally valid but missing "preferred" institutional language.
       - Low (<50%): Missing mandatory clauses or improper execution.

    4. Remediation:
       - Provide a legally-sound "Affidavit of Full Force and Effect" or "Amendment" template tailored to the friction points.

    Return the analysis in JSON format matching the AuditResult interface.
    Keys: id, timestamp, bankTarget, acceptanceProbability (0-100), primaryRedFlags, clauseAudit, executionAudit, remediationBlueprint {action1, action2, concreteFix, affidavitTemplate}, extractedData {principal, agent, state, date, rawText}.
    acceptanceProbability bands: 85-100 high, 50-84 medium, below 50 low.
  `.trim();
}

export function jurisdictionPrompt() {
  return `
    ${jurisdictionKnowledgePreamble()}

    You are a "Jurisdictional Law Tracker" for "ConcretePOA".
    Your task is to compare the provided Power of Attorney (POA) against the CURRENT 2026 statutory requirements for the state listed in the document.

    FOCUS AREAS:
    1. "Caution to the Principal" Section:
       - Is it verbatim as required by the latest 2026 state law?
       - Identify any "Statutory Drift" (e.g., outdated warnings, missing mandatory language).
    2. "Agent's Signature" Page:
       - Does the document include the mandatory "Agent's Signature" or "Agent's Acceptance" page if required by that specific state in 2026?
    3. Statutory Drift:
       - List any specific areas where the document has become legally obsolete due to new legislation passed between the document's execution date and March 2026.

    OUTPUT:
    Return the analysis in JSON format matching the JurisdictionResult interface.
    Include a 'statutoryYear' of 2026.
    'overallComplianceScore' should be 0-100 based on how well it matches 2026 mandates.
    cautionSectionVerbatim.status and agentSignaturePage.status must be compliant, non-compliant, or missing.
    statutoryDrift items use severity high, medium, or low.
  `.trim();
}

export function rejectionPrompt() {
  return `
    ${rejectionKnowledgePreamble()}

    You are a "Rejection Diagnostic Engine" for "ConcretePOA".
    
    INPUTS:
    1. A PDF/Image of a Rejected Power of Attorney (POA).
    2. A PDF/Image of the Bank's Rejection Letter.

    LOGIC:
    1. Analyze the Rejection Letter for keywords like "Indemnification," "Stale," "Third Party Form," "Statutory Gift," "Super Powers," etc.
    2. Locate the corresponding section in the POA that the bank is referencing.
    3. Compare the two. If the bank says "Missing Gifting Power," but the POA has a "General Power" section, explain to the user that "General" is not "Specific" enough for this bank's internal policy.
    4. Provide a "Translation" of the bank's legalese into a 3-step action plan for the caregiver.

    OUTPUT:
    Return the analysis in JSON format matching the RejectionDiagnosis interface.
    Keys: id, timestamp, bankName, rejectionReason, legaleseTranslation, poaConflictSection, actionPlan {step1, step2, step3}, remediationText.
  `.trim();
}
