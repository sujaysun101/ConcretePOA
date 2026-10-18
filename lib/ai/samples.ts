import type { AuditResult, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";

const SAMPLE_NOTE =
  "Sample response. ANTHROPIC_API_KEY is not configured, so this report was not produced by a model. It illustrates the review format with synthetic facts.";

export function sampleAudit(bank: string): AuditResult {
  const now = Date.now();
  return {
    id: `sample-audit-${now}`,
    timestamp: now,
    bankTarget: bank,
    acceptanceProbability: 58,
    primaryRedFlags: [
      `${SAMPLE_NOTE}`,
      `${bank} usually wants enumerated banking powers; this sample assumes a general "all lawful acts" grant.`,
      "Sample execution block is more than seven years old and would trigger a stale-document question.",
    ],
    clauseAudit: [
      "Durability is stated, but it is immediate rather than springing. Confirm that matches the account holder's intent.",
      "Gifting is mentioned only as a general power. Institutions that require a gifts rider will treat that as incomplete.",
      "No institution-specific indemnification paragraph is present in this sample document.",
    ],
    executionAudit: [
      "Sample notary acknowledgment names the principal but omits the commission expiration.",
      "Only one witness signature appears. Several states and institutions expect two.",
      "No agent acceptance page is attached.",
    ],
    remediationBlueprint: {
      action1: `Ask ${bank} legal intake which form they will accept before booking a branch appointment.`,
      action2: "Prepare an affidavit of full force and effect plus a short banking-powers amendment for counsel to review.",
      concreteFix:
        "The Agent may conduct banking transactions, including deposits, withdrawals, transfers, and account maintenance, at the named institution, and the institution may rely on this power until written revocation.",
      affidavitTemplate: `AFFIDAVIT OF FULL FORCE AND EFFECT (SAMPLE)\n\nI, the undersigned Agent, state that the Power of Attorney dated [execution date] appointing me to act for [principal] remains in full force and effect, has not been revoked, and that I am acting within the authority it grants.\n\nThis sample is not a legal instrument. Have counsel adapt it to the governing state and to ${bank}'s intake checklist.\n\n______________________________\nAgent\n`,
    },
    extractedData: {
      principal: "Sample Principal",
      agent: "Sample Agent",
      state: "CA",
      date: "2017-04-02",
    },
  };
}

export function sampleRejection(): RejectionDiagnosis {
  const now = Date.now();
  return {
    id: `sample-rejection-${now}`,
    timestamp: now,
    bankName: "Fidelity",
    rejectionReason:
      "Sample letter: the third-party form is stale and does not contain a statutory gifts rider or Fidelity indemnification.",
    legaleseTranslation: `${SAMPLE_NOTE} In plain language, the sample letter says the document is too old, too general, and missing the custodian's preferred protection language. A broad "all acts" clause is not the same as a specific gift power.`,
    poaConflictSection:
      "Article II grants every power the principal could exercise. The sample letter treats that as insufficient for gifting and for IRA beneficiary changes.",
    actionPlan: {
      step1: "Call the custodian's POA desk and ask whether they will review an attorney-certified copy or only their own form.",
      step2: "If the principal still has capacity, complete the institution form rather than arguing the general POA.",
      step3: "If capacity is gone, ask counsel whether a court proceeding is required for the blocked transaction.",
    },
    remediationText:
      "Sample remediation paragraph: Agent is authorized to make gifts consistent with the principal's prior pattern, not to exceed the annual exclusion, and the custodian is indemnified for good-faith reliance. Have counsel revise before use.",
  };
}

export function sampleJurisdiction(): JurisdictionResult {
  const now = Date.now();
  return {
    id: `sample-jurisdiction-${now}`,
    timestamp: now,
    state: "FL",
    statutoryYear: 2026,
    cautionSectionVerbatim: {
      status: "non-compliant",
      requiredText:
        "Compare the caution to the current Florida statutory durable power of attorney notice. This sample does not quote a statute verbatim.",
      actualText: "Notice: this document gives your agent broad authority.",
      driftDetails: `${SAMPLE_NOTE} The sample notice is shorter than the statutory caution Florida institutions expect to see.`,
    },
    agentSignaturePage: {
      status: "missing",
      requirements: "Look for an agent acknowledgment or acceptance where the institution's checklist asks for one.",
      driftDetails: "The sample file ends at the principal signature and notary block.",
    },
    statutoryDrift: [
      {
        title: "Witness count",
        description: "Sample shows one witness. Florida durable POA execution practice expects two witnesses plus a notary.",
        severity: "high",
        remediation: "Do not rely on this sample for a filing. If the principal has capacity, re-execute on the current statutory form.",
      },
      {
        title: "Superpower initials",
        description: "Trust and beneficiary powers are buried in a general grant rather than separately authorized.",
        severity: "medium",
        remediation: "Highlight those powers for counsel. Several institutions will not infer them.",
      },
    ],
    overallComplianceScore: 41,
  };
}
