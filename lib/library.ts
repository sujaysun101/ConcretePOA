import { BANK_REQUIREMENTS } from "@/lib/banks";
import type { RuleRecord } from "@/lib/types";

const YEAR = 2026;

function rule(partial: Omit<RuleRecord, "orgId" | "custom" | "year"> & { year?: number | null }): RuleRecord {
  return {
    orgId: null,
    custom: false,
    year: partial.year ?? YEAR,
    ...partial,
  };
}

const JURISDICTION_RULES: RuleRecord[] = [
  rule({
    id: "ca-caution",
    scope: "jurisdiction",
    jurisdiction: "California",
    institution: null,
    topic: "Warning on the statutory form",
    requirement:
      "If the document uses the California uniform statutory form, confirm the warning to the principal matches the current form published with the Power of Attorney Law. A shortened paraphrase is a common reason a branch sends the file to legal.",
    severity: "high",
    citation: "Cal. Prob. Code Division 4.5 (Powers of Attorney)",
    notes: "Review checkpoint. Confirm the current statutory text before relying on it.",
  }),
  rule({
    id: "ca-execution",
    scope: "jurisdiction",
    jurisdiction: "California",
    institution: null,
    topic: "Notary or two witnesses",
    requirement:
      "Confirm the execution block matches the form actually used. Statutory-form practice turns on a notary acknowledgment, and some real-estate uses still expect witness formalities. Do not assume a single signature line is enough.",
    severity: "high",
    citation: "Cal. Prob. Code Division 4.5",
    notes: "Real property recordings have their own cover-sheet and notarization habits.",
  }),
  rule({
    id: "ca-authority",
    scope: "jurisdiction",
    jurisdiction: "California",
    institution: null,
    topic: "Gifts and trust changes are not implied",
    requirement:
      "A general grant to do all acts the principal could do is not a safe substitute for an express gift, beneficiary, or trust-creation power. Flag those sections when the planned transaction needs them.",
    severity: "high",
    citation: "Cal. Prob. Code Division 4.5",
    notes: null,
  }),
  rule({
    id: "ca-springing",
    scope: "jurisdiction",
    jurisdiction: "California",
    institution: null,
    topic: "Springing trigger",
    requirement:
      "If the power is springing, the trigger and the proof the institution may rely on should be readable without a physician-shopping dispute. Immediate powers should say so plainly.",
    severity: "medium",
    citation: "Cal. Prob. Code Division 4.5",
    notes: null,
  }),
  rule({
    id: "ny-gifts",
    scope: "jurisdiction",
    jurisdiction: "New York",
    institution: null,
    topic: "Statutory gifts rider",
    requirement:
      "Major gifts are not carried by the short-form construction sections alone. Look for a separate statutory gifts rider when the transaction is a gift, and treat a missing rider as high friction at broker-dealers.",
    severity: "high",
    citation: "N.Y. General Obligations Law Title 15",
    notes: "Modifications written into the margin are a frequent rejection point.",
  }),
  rule({
    id: "ny-witnesses",
    scope: "jurisdiction",
    jurisdiction: "New York",
    institution: null,
    topic: "Witnesses on the statutory short form",
    requirement:
      "Check for two disinterested witnesses where the statutory short form requires them, plus the notary acknowledgment. A notary standing in for both witnesses is not a safe assumption.",
    severity: "high",
    citation: "N.Y. General Obligations Law Title 15",
    notes: null,
  }),
  rule({
    id: "ny-enumerated",
    scope: "jurisdiction",
    jurisdiction: "New York",
    institution: null,
    topic: "Enumerated construction of powers",
    requirement:
      "Broker-dealers often read the statutory construction sections literally. If banking or securities powers are crossed out or left blank, do not describe the document as a full financial POA.",
    severity: "medium",
    citation: "N.Y. General Obligations Law Title 15",
    notes: null,
  }),
  rule({
    id: "fl-witnesses",
    scope: "jurisdiction",
    jurisdiction: "Florida",
    institution: null,
    topic: "Two witnesses and a notary",
    requirement:
      "Florida durable POA execution practice expects the principal's signature, two witnesses, and a notary. A missing witness is a high-severity finding even when the notary block looks complete.",
    severity: "high",
    citation: "Fla. Stat. Chapter 709",
    notes: "Institutions in other states still apply this when the document says Florida law governs.",
  }),
  rule({
    id: "fl-super",
    scope: "jurisdiction",
    jurisdiction: "Florida",
    institution: null,
    topic: "Separately granted superpowers",
    requirement:
      "Powers to change beneficiaries, make gifts, or create or amend trusts should be specifically authorized, not inferred from a general paragraph. Initialed or separately signed grants are the pattern reviewers expect.",
    severity: "high",
    citation: "Fla. Stat. Chapter 709",
    notes: null,
  }),
  rule({
    id: "fl-agent",
    scope: "jurisdiction",
    jurisdiction: "Florida",
    institution: null,
    topic: "Agent certification",
    requirement:
      "Many Florida institutions ask the agent for a certification or affidavit that the power is in force. Note when the packet has no agent acknowledgment page.",
    severity: "medium",
    citation: "Fla. Stat. Chapter 709",
    notes: null,
  }),
  rule({
    id: "tx-notice",
    scope: "jurisdiction",
    jurisdiction: "Texas",
    institution: null,
    topic: "Notice to the principal",
    requirement:
      "Compare the notice at the front of a Texas durable POA with the current statutory form. Outdated warning language is a common drift finding on documents executed before later form revisions.",
    severity: "high",
    citation: "Tex. Estates Code Chapter 751",
    notes: "Do not treat a paraphrase as the statutory notice.",
  }),
  rule({
    id: "tx-record",
    scope: "jurisdiction",
    jurisdiction: "Texas",
    institution: null,
    topic: "Recording for real property",
    requirement:
      "If the planned use is a deed or homestead transaction, check whether the power must be recorded in the county records before the closer will accept it. Financial-account use and real-estate use are different checklists.",
    severity: "medium",
    citation: "Tex. Estates Code Chapter 751",
    notes: null,
  }),
  rule({
    id: "tx-specific",
    scope: "jurisdiction",
    jurisdiction: "Texas",
    institution: null,
    topic: "Specific authority",
    requirement:
      "Certain acts, including some gift and survivorship decisions, need a specific grant. A blanket 'every power I have' sentence should be flagged when the transaction is one of those acts.",
    severity: "high",
    citation: "Tex. Estates Code Chapter 751",
    notes: null,
  }),
  rule({
    id: "il-act",
    scope: "jurisdiction",
    jurisdiction: "Illinois",
    institution: null,
    topic: "Statutory short form notice",
    requirement:
      "Illinois statutory short-form documents carry a notice to the principal and a defined list of powers. Custom long-form documents should still be checked for witness and notary formalities and for an express durability statement.",
    severity: "high",
    citation: "755 ILCS 45 (Illinois Power of Attorney Act)",
    notes: "Health-care and property powers are different instruments. Do not mix the checklists.",
  }),
  rule({
    id: "il-witness",
    scope: "jurisdiction",
    jurisdiction: "Illinois",
    institution: null,
    topic: "Witness on the property power",
    requirement:
      "Confirm the property power has the witness formalities the statutory form uses. A notary-only acknowledgment on a form that also expects a witness is a friction point at banks.",
    severity: "medium",
    citation: "755 ILCS 45",
    notes: null,
  }),
  rule({
    id: "pa-notice",
    scope: "jurisdiction",
    jurisdiction: "Pennsylvania",
    institution: null,
    topic: "Notice and acknowledgment",
    requirement:
      "Pennsylvania durable powers carry a prescribed notice and an agent acknowledgment. Missing either one is a high-severity execution finding, separate from whether the powers themselves are broad enough.",
    severity: "high",
    citation: "20 Pa.C.S. Chapter 56",
    notes: "Confirm the current notice language; form text has been revised over time.",
  }),
  rule({
    id: "pa-gifts",
    scope: "jurisdiction",
    jurisdiction: "Pennsylvania",
    institution: null,
    topic: "Limited gift authority",
    requirement:
      "Do not describe gift authority as present unless the document grants it in the way the statute recognizes. Hot powers are a separate review from ordinary banking powers.",
    severity: "high",
    citation: "20 Pa.C.S. Chapter 56",
    notes: null,
  }),
  rule({
    id: "oh-form",
    scope: "jurisdiction",
    jurisdiction: "Ohio",
    institution: null,
    topic: "Statutory form and durability",
    requirement:
      "Check whether the document follows the Ohio statutory form or a custom draft, and whether durability is explicit. Springing language should name who may certify the triggering condition.",
    severity: "medium",
    citation: "Ohio Rev. Code Chapter 1337",
    notes: null,
  }),
  rule({
    id: "oh-notary",
    scope: "jurisdiction",
    jurisdiction: "Ohio",
    institution: null,
    topic: "Notary acknowledgment",
    requirement:
      "The acknowledgment should identify the principal and the notary's commission. Blank commission expirations are a routine branch rejection even when the signature is genuine.",
    severity: "medium",
    citation: "Ohio Rev. Code Chapter 1337",
    notes: null,
  }),
  rule({
    id: "nc-upoaa",
    scope: "jurisdiction",
    jurisdiction: "North Carolina",
    institution: null,
    topic: "Statutory form execution",
    requirement:
      "North Carolina's power of attorney statute follows a uniform-act pattern. Confirm the acknowledgment and any required witness, and do not infer gift or beneficiary authority from a general grant.",
    severity: "high",
    citation: "N.C. Gen. Stat. Chapter 32C",
    notes: "Chapter 32C enacted a version of the Uniform Power of Attorney Act. Confirm later amendments before quoting text.",
  }),
  rule({
    id: "wa-upoaa",
    scope: "jurisdiction",
    jurisdiction: "Washington",
    institution: null,
    topic: "Uniform-act execution and specific gifts",
    requirement:
      "Washington's uniform power of attorney chapter expects a notarized signature and treats certain gift and beneficiary powers as specific authority. Flag general-only grants when the transaction needs those powers.",
    severity: "high",
    citation: "RCW 11.125",
    notes: null,
  }),
  rule({
    id: "az-article",
    scope: "jurisdiction",
    jurisdiction: "Arizona",
    institution: null,
    topic: "Durable language and recording",
    requirement:
      "Confirm the document says it is durable, that the notary block is complete, and whether a real-estate use needs to be recorded. Financial institutions still reject undated notary seals.",
    severity: "medium",
    citation: "A.R.S. Title 14, Chapter 5 (Powers of Attorney)",
    notes: "Citation is to the article, not a claim that every subsection matches this checklist.",
  }),
  rule({
    id: "nj-durable",
    scope: "jurisdiction",
    jurisdiction: "New Jersey",
    institution: null,
    topic: "Durable power formalities",
    requirement:
      "Check for an explicit durability statement, a complete notary acknowledgment, and separately stated authority for gifts or beneficiary changes. A one-page 'all powers' letter is high friction at brokerage firms.",
    severity: "high",
    citation: "N.J.S.A. 46:2B (power of attorney provisions)",
    notes: "Confirm the current subsection before quoting statutory text.",
  }),
  rule({
    id: "generic-nexus",
    scope: "jurisdiction",
    jurisdiction: "Unstated",
    institution: null,
    topic: "Name the governing law",
    requirement:
      "If the document never says which state's law governs, the review should stop short of a compliance score and ask for the execution state. Multi-state packets need the institution's choice, not a guess.",
    severity: "high",
    citation: null,
    notes: "Use this when the upload does not identify a state.",
  }),
];

function institutionRules(): RuleRecord[] {
  const rows: RuleRecord[] = [];
  for (const bank of BANK_REQUIREMENTS) {
    bank.clauses.forEach((clause, index) => {
      rows.push(
        rule({
          id: `inst-${bank.bank}-clause-${index}`,
          scope: "institution",
          jurisdiction: null,
          institution: bank.bank,
          topic: clause,
          requirement: `${bank.bank} reviewers look for this clause before they treat a third-party POA as routine. Absence usually means legal escalation rather than same-day acceptance.`,
          severity: "high",
          citation: "ConcretePOA institutional rubric",
          notes: bank.ageLimitations,
        }),
      );
    });
    bank.highFrictionRules.forEach((item, index) => {
      rows.push(
        rule({
          id: `inst-${bank.bank}-friction-${index}`,
          scope: "institution",
          jurisdiction: null,
          institution: bank.bank,
          topic: item,
          requirement: item,
          severity: index === 0 ? "high" : "medium",
          citation: "ConcretePOA institutional rubric",
          notes: bank.ageLimitations,
        }),
      );
    });
    rows.push(
      rule({
        id: `inst-${bank.bank}-age`,
        scope: "institution",
        jurisdiction: null,
        institution: bank.bank,
        topic: "Age of the document",
        requirement: bank.ageLimitations,
        severity: "medium",
        citation: "ConcretePOA institutional rubric",
        notes: bank.formatting.join("; "),
      }),
    );
  }
  return rows;
}

export function builtinRules(): RuleRecord[] {
  return [...JURISDICTION_RULES, ...institutionRules()];
}
