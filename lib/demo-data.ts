import type { AuditResult, CaseRecord, JurisdictionResult, RejectionDiagnosis } from "@/lib/types";

const DEMO_USER = "user_demo_harbor";

function auditFindings(input: {
  id: string;
  at: string;
  bank: string;
  score: number;
  principal: string;
  agent: string;
  state: string;
  date: string;
  flags: string[];
  clauses: string[];
  execution: string[];
  action1: string;
  action2: string;
  fix: string;
}): AuditResult {
  return {
    id: input.id,
    timestamp: Date.parse(input.at),
    bankTarget: input.bank,
    acceptanceProbability: input.score,
    primaryRedFlags: input.flags,
    clauseAudit: input.clauses,
    executionAudit: input.execution,
    remediationBlueprint: {
      action1: input.action1,
      action2: input.action2,
      concreteFix: input.fix,
      affidavitTemplate: `AFFIDAVIT OF FULL FORCE AND EFFECT\n\nI, ${input.agent}, state that the power of attorney executed by ${input.principal} on ${input.date} remains in effect, has not been revoked, and that I am the acting agent named in it.\n\nI further state that the authority I am using includes the banking transactions described in the attached concrete fix, and that I am not aware of any court order limiting that authority.\n\nThis demo affidavit is a starting point for counsel. It is not a filing-ready instrument.\n\nDated: ______________\n\n________________________________\n${input.agent}, Agent`,
    },
    extractedData: {
      principal: input.principal,
      agent: input.agent,
      state: input.state,
      date: input.date,
    },
  };
}

export function demoCases(orgId: string): CaseRecord[] {
  const hale = auditFindings({
    id: "case_hale_vanguard",
    at: "2026-09-19T15:10:00.000Z",
    bank: "Vanguard",
    score: 31,
    principal: "Robert Hale",
    agent: "Claire Hale",
    state: "FL",
    date: "2018-11-03",
    flags: [
      "Third-party Florida durable POA. Vanguard's rubric prefers its own agent authorization, and this file will likely sit in legal escalation.",
      "Executed in 2018, outside the three-year window Vanguard prefers for a non-proprietary form.",
      "Gift and beneficiary language is a single general sentence. That is not the specific authority Vanguard asks for before an IRA change.",
    ],
    clauses: [
      "Durability is present and immediate: 'This power shall not be affected by my subsequent disability.'",
      "Banking is granted only by reference to 'every act I could do.' There is no Vanguard indemnification paragraph.",
      "No electronic-delivery consent and no trustee power for the Hale Family Revocable Trust, which holds the brokerage sleeve.",
    ],
    execution: [
      "Florida execution: one witness signature is visible. The statutory pattern reviewers expect is two witnesses plus a notary.",
      "Notary seal is legible, but the commission expiration is handwritten over a blank.",
      "No agent acceptance page is attached.",
    ],
    action1: "Do not book a branch appointment until Claire completes Vanguard's full agent authorization or counsel confirms a narrow exception.",
    action2: "If Robert still has capacity, re-execute on Vanguard's form. If he does not, ask counsel whether a court order is required for the IRA beneficiary change.",
    fix: "The Agent may act on Vanguard brokerage and IRA accounts titled to the principal, including transfers between identically titled accounts, and Vanguard may rely on this authorization until it receives written revocation. Beneficiary changes require the separate grant in Schedule A.",
  });

  const ellison = auditFindings({
    id: "case_ellison_chase",
    at: "2026-07-16T18:00:00.000Z",
    bank: "Chase",
    score: 64,
    principal: "Margaret Ellison",
    agent: "Daniel Ellison",
    state: "CA",
    date: "2021-06-12",
    flags: [
      "California statutory form is mostly intact, but the banking-powers initial is faint and Chase intake often treats an unclear initial as a missing power.",
      "Notary commission is valid on its face. No medallion issue for ordinary deposit accounts.",
    ],
    clauses: [
      "Durability clause matches the statutory immediate-power wording.",
      "Indemnification of the bank is not in the statutory form. Chase may still ask for its own affidavit.",
      "Beneficiary changes are not initialed. Do not use this document for POD or trust restatements.",
    ],
    execution: [
      "Notary acknowledgment names Margaret Ellison and includes a commission number.",
      "No handwritten alterations on the powers grid.",
      "Successor agent is named, with no affidavit explaining that the primary agent resigned.",
    ],
    action1: "Send Daniel to the branch with a fresh agent certification and a readable copy, not the original with the faint initial.",
    action2: "If the checking account is the only goal, ask the banker to accept the statutory banking power and to ignore the uninitialed gift lines.",
    fix: "The Agent may open, maintain, and transact on deposit accounts at JPMorgan Chase Bank, N.A., and the bank is entitled to rely on this power until written notice of revocation.",
  });

  const nguyen = auditFindings({
    id: "case_nguyen_schwab",
    at: "2026-05-14T14:20:00.000Z",
    bank: "Schwab",
    score: 86,
    principal: "Patricia Nguyen",
    agent: "Leo Nguyen",
    state: "CA",
    date: "2024-02-09",
    flags: [
      "Wet-ink full power is present and recent. Residual friction is limited to discretionary authority on the managed sleeve.",
    ],
    clauses: [
      "Full power of attorney and limited trading authorization are both attached.",
      "Indemnification language tracks the language Schwab publishes for attorney-in-fact packets.",
      "Discretionary authority for the managed account is in a side letter dated the same day.",
    ],
    execution: [
      "Notary block is complete.",
      "Agent photo ID is noted on the intake cover sheet included in the upload.",
      "Document is under the seven-year affidavit threshold.",
    ],
    action1: "Submit the packet as-is for the brokerage account.",
    action2: "Keep the side letter stapled in front. Managed-account desks look for it separately from the POA.",
    fix: "The Agent has discretionary authority over the managed account identified in the side letter, and Charles Schwab & Co. may rely on instructions from the Agent until written revocation.",
  });

  const cho = auditFindings({
    id: "case_cho_wellsfargo",
    at: "2026-05-28T16:40:00.000Z",
    bank: "Wells Fargo",
    score: 72,
    principal: "Helen Cho",
    agent: "Mina Cho",
    state: "IL",
    date: "2022-09-30",
    flags: [
      "Banking powers are enumerated, but the separate agent affidavit Wells Fargo asks for is not in the packet.",
    ],
    clauses: [
      "Section-style banking powers list deposits, withdrawals, and safe-deposit access.",
      "A general 'all powers' fallback sits underneath the list. Some reviewers ignore the fallback and read only the list.",
      "No gift power. That is acceptable if the request is limited to the operating account.",
    ],
    execution: [
      "Principal signature is clear.",
      "One witness signed. Illinois statutory property forms are more comfortable with the witness line filled.",
      "Notary seal is present.",
    ],
    action1: "Have Mina sign the bank's agent affidavit before the appointment.",
    action2: "Point the banker at the enumerated banking list rather than the general fallback paragraph.",
    fix: "The Agent accepts appointment and may conduct the banking transactions enumerated in the power, and Wells Fargo may rely on this affidavit.",
  });

  const alvarez = auditFindings({
    id: "case_alvarez_bofa",
    at: "2026-09-02T13:05:00.000Z",
    bank: "Bank of America",
    score: 47,
    principal: "David Alvarez",
    agent: "Rosa Alvarez",
    state: "FL",
    date: "2014-01-19",
    flags: [
      "Executed in 2014. Bank of America may require re-execution after ten years.",
      "Successor agent is acting, and the packet does not show why the original agent stopped.",
      "Real-estate powers are broad, but the request on file is a deposit account. The mismatch invites extra review.",
    ],
    clauses: [
      "Durability clause is present.",
      "Banking transactions are granted in one line, without the bank's preferred enumeration.",
      "No indemnification of the bank.",
    ],
    execution: [
      "Two witnesses and a notary appear, consistent with Florida practice at the time.",
      "Notary commission expired years ago, which is normal, but the seal impression is smudged on the scan.",
      "No fresh certification from Rosa.",
    ],
    action1: "Obtain a current agent affidavit and a clean scan before submitting.",
    action2: "If David has capacity, a new statutory form will be faster than debating the 2014 document.",
    fix: "The successor Agent may conduct banking transactions on accounts titled to the principal, and Bank of America may rely on this certification that the original agent is unable to act.",
  });

  const adeyemi = auditFindings({
    id: "case_adeyemi_truist",
    at: "2026-10-02T17:25:00.000Z",
    bank: "Truist",
    score: 79,
    principal: "Grace Adeyemi",
    agent: "Samuel Adeyemi",
    state: "NC",
    date: "2023-08-14",
    flags: [
      "North Carolina execution looks complete. The open item is gift language Truist will ask about if the request is more than account maintenance.",
    ],
    clauses: [
      "Two-witness requirement is satisfied on the face of the document.",
      "Indemnification of third parties is included.",
      "Gifts are limited to the annual exclusion and only to descendants. That is specific enough to describe, and narrow enough that a large transfer will be refused.",
    ],
    execution: [
      "Wet-ink signatures.",
      "Notary seal is clear.",
      "Document is inside a seven-year review window.",
    ],
    action1: "Submit for the deposit account with a cover note that no gift is being requested.",
    action2: "Do not use this POA for a beneficiary change. The gift clause does not reach that act.",
    fix: "The Agent may maintain deposit accounts at Truist and may not change payable-on-death beneficiaries under this instrument.",
  });

  const vasquez: RejectionDiagnosis = {
    id: "case_vasquez_fidelity",
    timestamp: Date.parse("2026-08-04T19:12:00.000Z"),
    bankName: "Fidelity",
    rejectionReason:
      "Letter dated July 22, 2026: 'Third-party form rejected. Statutory gift authority not stated. Document appears stale. Fidelity indemnification absent. IRA beneficiary change cannot be processed.'",
    legaleseTranslation:
      "Fidelity is not saying the New York short form is void. It is saying a general power is not a gifts rider, the 2016 date pushed the file into manual review, and they will not change an IRA beneficiary without their own indemnification language.",
    poaConflictSection:
      "Paragraph 4 grants 'all powers conferred by the statutory short form.' The modifications page does not add a statutory gifts rider. The IRA change Elena wants is exactly the act the letter refuses.",
    actionPlan: {
      step1: "Stop arguing the general paragraph. Ask Fidelity whether the principal can still sign their POA form.",
      step2: "If Elena's mother still has capacity, complete the Fidelity form and a gifts rider only if counsel agrees a gift is actually intended.",
      step3: "If capacity is gone, the IRA beneficiary change probably needs a court appointment. The POA path is closed for that act.",
    },
    remediationText:
      "For counsel: a gifts rider, if still possible, should name the permitted donees and a dollar cap. A sentence that says 'all powers' will not answer this letter. Fidelity's indemnification paragraph has to be the one they publish, not a paraphrase.",
  };

  const feldman: RejectionDiagnosis = {
    id: "case_feldman_pnc",
    timestamp: Date.parse("2026-10-15T12:30:00.000Z"),
    bankName: "PNC",
    rejectionReason:
      "Estate-intake email: successor agent not documented, and the banking-transactions power is initialed in a way the scanner read as blank.",
    legaleseTranslation:
      "PNC's estate desk did not reject the Pennsylvania notice. They cannot tell who is allowed to act today, and the initials next to banking transactions did not survive the scan.",
    poaConflictSection:
      "Page 2 names Martin Feldman as successor. Page 1 still lists his brother Aaron as primary, with no resignation or death certificate behind the letter. The banking initial is a light pencil mark.",
    actionPlan: {
      step1: "Send a death certificate or resignation for Aaron, plus Martin's acceptance.",
      step2: "Rescan in color so the banking initial is visible, or have counsel initial a restated page if the mark is genuinely ambiguous.",
      step3: "Limit the first request to the operating account. Do not add a CD redemption until the agent identity is accepted.",
    },
    remediationText:
      "Cover note: Aaron Feldman ceased to act on March 2, 2026. Martin Feldman accepts appointment as successor agent and requests banking authority only, as initialed on page 3. Attach the proof and a color scan.",
  };

  const okonkwo: JurisdictionResult = {
    id: "case_okonkwo_tx",
    timestamp: Date.parse("2026-06-09T15:45:00.000Z"),
    state: "Texas",
    statutoryYear: 2026,
    cautionSectionVerbatim: {
      status: "non-compliant",
      requiredText:
        "The current Texas statutory durable power of attorney opens with a prescribed notice to the principal. Compare this document to that notice rather than to a generic warning.",
      actualText: "Important information for the person executing this document. Please read it carefully. Your agent will have authority to act for you.",
      driftDetails:
        "The notice is a short paraphrase. It does not track the statutory notice James's 2019 form would be measured against in a 2026 intake review.",
    },
    agentSignaturePage: {
      status: "missing",
      requirements: "Texas reviewers look for a clear agent acceptance when the agent is about to use the power at a bank.",
      driftDetails: "The file ends after the principal acknowledgment. No agent signature page is included.",
    },
    statutoryDrift: [
      {
        title: "Outdated principal notice",
        description: "The warning predates later statutory-form revisions and will read as drift against a 2026 checklist.",
        severity: "high",
        remediation: "If James has capacity, re-execute on the current statutory form. Do not rely on the paraphrase.",
      },
      {
        title: "Real-property recording not addressed",
        description: "The power grants real-property authority but says nothing about county recording.",
        severity: "medium",
        remediation: "Separate the financial-account request from any deed. Recording is a different checklist.",
      },
      {
        title: "Specific gift grant absent",
        description: "Gift language is 'as I could do myself,' which is the pattern Texas reviewers flag.",
        severity: "high",
        remediation: "Do not process a gift under this document without a specific grant reviewed by counsel.",
      },
    ],
    overallComplianceScore: 58,
  };

  const brooks: JurisdictionResult = {
    id: "case_brooks_nj",
    timestamp: Date.parse("2026-06-22T14:00:00.000Z"),
    state: "New Jersey",
    statutoryYear: 2026,
    cautionSectionVerbatim: {
      status: "missing",
      requiredText: "A New Jersey durable power should make durability explicit and warn the principal that the grant survives incapacity.",
      actualText: "",
      driftDetails: "The uploaded custom draft never uses the word durable and has no caution block.",
    },
    agentSignaturePage: {
      status: "compliant",
      requirements: "Agent acknowledgment present.",
      driftDetails: "The agent signed an acceptance. That part is not the problem.",
    },
    statutoryDrift: [
      {
        title: "Durability not stated",
        description: "Without an explicit durability sentence, a bank can treat the power as ending at incapacity, which defeats the reason the family is presenting it.",
        severity: "high",
        remediation: "Do not submit this draft. Have counsel restate it as a durable power.",
      },
      {
        title: "One-page all-powers letter",
        description: "Brokerage firms in this workspace's rubric treat a one-page general letter as high friction.",
        severity: "medium",
        remediation: "Enumerate banking and securities powers on a separate schedule.",
      },
    ],
    overallComplianceScore: 44,
  };

  const rows: Array<Omit<CaseRecord, "orgId"> & { findings: CaseRecord["findings"] }> = [
    {
      id: hale.id,
      userId: DEMO_USER,
      title: "Robert Hale · Vanguard",
      kind: "audit",
      status: "ready",
      bankTarget: "Vanguard",
      state: "FL",
      principal: "Robert Hale",
      agent: "Claire Hale",
      executionDate: "2018-11-03",
      fileName: "Hale-FL-durable-POA-2018.pdf",
      score: 31,
      summary: "Proprietary Vanguard form not used, Florida witness block is short one witness, and the IRA change is not specifically authorized.",
      findings: hale,
      isDemo: true,
      isSample: false,
      createdAt: "2026-09-19T15:10:00.000Z",
    },
    {
      id: alvarez.id,
      userId: DEMO_USER,
      title: "David Alvarez · Bank of America",
      kind: "audit",
      status: "ready",
      bankTarget: "Bank of America",
      state: "FL",
      principal: "David Alvarez",
      agent: "Rosa Alvarez",
      executionDate: "2014-01-19",
      fileName: "Alvarez-POA-2014.pdf",
      score: 47,
      summary: "Twelve-year-old Florida POA with a successor agent and no proof of why the original agent stopped acting.",
      findings: alvarez,
      isDemo: true,
      isSample: false,
      createdAt: "2026-09-02T13:05:00.000Z",
    },
    {
      id: ellison.id,
      userId: DEMO_USER,
      title: "Margaret Ellison · Chase",
      kind: "audit",
      status: "ready",
      bankTarget: "Chase",
      state: "CA",
      principal: "Margaret Ellison",
      agent: "Daniel Ellison",
      executionDate: "2021-06-12",
      fileName: "Ellison-CA-statutory.pdf",
      score: 64,
      summary: "California statutory form is usable for deposit accounts if the banking initial is readable and gift lines stay unused.",
      findings: ellison,
      isDemo: true,
      isSample: false,
      createdAt: "2026-07-16T18:00:00.000Z",
    },
    {
      id: cho.id,
      userId: DEMO_USER,
      title: "Helen Cho · Wells Fargo",
      kind: "audit",
      status: "ready",
      bankTarget: "Wells Fargo",
      state: "IL",
      principal: "Helen Cho",
      agent: "Mina Cho",
      executionDate: "2022-09-30",
      fileName: "Cho-IL-property-POA.pdf",
      score: 72,
      summary: "Enumerated banking powers are present. The packet is missing the agent affidavit Wells Fargo asks for.",
      findings: cho,
      isDemo: true,
      isSample: false,
      createdAt: "2026-05-28T16:40:00.000Z",
    },
    {
      id: nguyen.id,
      userId: DEMO_USER,
      title: "Patricia Nguyen · Schwab",
      kind: "audit",
      status: "ready",
      bankTarget: "Schwab",
      state: "CA",
      principal: "Patricia Nguyen",
      agent: "Leo Nguyen",
      executionDate: "2024-02-09",
      fileName: "Nguyen-Schwab-full-POA.pdf",
      score: 86,
      summary: "Recent wet-ink full power with a same-day side letter for the managed account.",
      findings: nguyen,
      isDemo: true,
      isSample: false,
      createdAt: "2026-05-14T14:20:00.000Z",
    },
    {
      id: adeyemi.id,
      userId: DEMO_USER,
      title: "Grace Adeyemi · Truist",
      kind: "audit",
      status: "ready",
      bankTarget: "Truist",
      state: "NC",
      principal: "Grace Adeyemi",
      agent: "Samuel Adeyemi",
      executionDate: "2023-08-14",
      fileName: "Adeyemi-NC-POA.pdf",
      score: 79,
      summary: "Execution formalities look complete. Gift authority is deliberately narrow and should be described that way.",
      findings: adeyemi,
      isDemo: true,
      isSample: false,
      createdAt: "2026-10-02T17:25:00.000Z",
    },
    {
      id: vasquez.id,
      userId: DEMO_USER,
      title: "Elena Vasquez · Fidelity rejection",
      kind: "diagnosis",
      status: "ready",
      bankTarget: "Fidelity",
      state: "NY",
      principal: "Elena Vasquez",
      agent: "Elena Vasquez",
      executionDate: "2016-05-01",
      fileName: "Vasquez-rejection-letter.pdf",
      score: 28,
      summary: "Fidelity refused an IRA beneficiary change because the New York short form has no gifts rider and no Fidelity indemnification.",
      findings: vasquez,
      isDemo: true,
      isSample: false,
      createdAt: "2026-08-04T19:12:00.000Z",
    },
    {
      id: feldman.id,
      userId: DEMO_USER,
      title: "Martin Feldman · PNC rejection",
      kind: "diagnosis",
      status: "ready",
      bankTarget: "PNC",
      state: "PA",
      principal: "Ruth Feldman",
      agent: "Martin Feldman",
      executionDate: "2020-10-08",
      fileName: "Feldman-PNC-estate-email.pdf",
      score: 36,
      summary: "PNC cannot tell which agent is acting, and the banking initial did not survive the scan.",
      findings: feldman,
      isDemo: true,
      isSample: false,
      createdAt: "2026-10-15T12:30:00.000Z",
    },
    {
      id: okonkwo.id,
      userId: DEMO_USER,
      title: "James Okonkwo · Texas statutory drift",
      kind: "jurisdiction",
      status: "ready",
      bankTarget: null,
      state: "TX",
      principal: "James Okonkwo",
      agent: "Ada Okonkwo",
      executionDate: "2019-03-28",
      fileName: "Okonkwo-TX-durable.pdf",
      score: 58,
      summary: "The principal notice is a paraphrase, and gift authority is not specific enough for a 2026 Texas checklist.",
      findings: okonkwo,
      isDemo: true,
      isSample: false,
      createdAt: "2026-06-09T15:45:00.000Z",
    },
    {
      id: brooks.id,
      userId: DEMO_USER,
      title: "Samuel Brooks · New Jersey draft",
      kind: "jurisdiction",
      status: "ready",
      bankTarget: null,
      state: "NJ",
      principal: "Samuel Brooks",
      agent: "Hannah Brooks",
      executionDate: "2025-12-02",
      fileName: "Brooks-NJ-custom-draft.pdf",
      score: 44,
      summary: "Custom New Jersey draft never says the power is durable, so a bank can treat it as ending at incapacity.",
      findings: brooks,
      isDemo: true,
      isSample: false,
      createdAt: "2026-06-22T14:00:00.000Z",
    },
  ];

  return rows.map((row) => ({ ...row, orgId }));
}
