import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as fs from "node:fs/promises";
import * as path from "node:path";

interface SyntheticCase {
  id: string;
  name: string;
  mode: "audit" | "diagnosis" | "jurisdiction";
  bank?: string;
  state?: string;
  description: string;
  text: string;
  rejectionText?: string;
  expectedOutcome: {
    minScore?: number;
    maxScore?: number;
    expectedStatus?: string;
    mustContainRedFlag?: string;
  };
}

const CASES: SyntheticCase[] = [
  {
    id: "case-01-ny-compliant",
    name: "NY Statutory Short Form (Fully Compliant)",
    mode: "jurisdiction",
    state: "NY",
    description: "New York statutory durable POA signed, dated, acknowledged before notary, with two disinterested adult witnesses and executed agent acceptance.",
    text: `POWER OF ATTORNEY - NEW YORK STATUTORY SHORT FORM
CAUTION TO THE PRINCIPAL: Your Power of Attorney is an important document. As the "principal," you give the person whom you choose (your "agent") authority to spend your money and sell or dispose of your property during your lifetime without your telling him or her to do so.
Principal: John Doe, residing at 123 Elm St, New York, NY.
Agent: Jane Doe, residing at 456 Oak St, New York, NY.
Grant of Authority: Full banking transactions, real estate transactions, tax matters.
I grant my agent authority to act in accordance with New York General Obligations Law.
Date: January 15, 2026. Signature of Principal: John Doe.
State of New York, County of New York. On Jan 15, 2026 before me, notary public, appeared John Doe.
Witness 1: Robert Smith, 789 Pine St, NY. Witness 2: Alice Jones, 321 Cedar St, NY. Neither is named as agent.
AGENT'S SIGNATURE AND ACKNOWLEDGMENT: I, Jane Doe, accept my appointment as agent under this power of attorney. Signature: Jane Doe. Date: Jan 16, 2026. Notary acknowledgment for Agent attached.`,
    expectedOutcome: { minScore: 90, expectedStatus: "compliant" },
  },
  {
    id: "case-02-ny-missing-agent-acceptance",
    name: "NY POA Missing Agent Acceptance Page",
    mode: "jurisdiction",
    state: "NY",
    description: "NY POA executed properly by principal but completely missing the mandatory statutory agent acceptance page.",
    text: `POWER OF ATTORNEY - NEW YORK
Principal: Eleanor Vance. Agent: Thomas Vance.
Full general authority granted.
Signed and notarized on February 10, 2026.
Witnessed by two adult witnesses: Mary Lee, Paul Walker.
[END OF DOCUMENT - NO AGENT ACCEPTANCE ATTACHED]`,
    expectedOutcome: { maxScore: 60, mustContainRedFlag: "agent" },
  },
  {
    id: "case-03-ny-notary-as-witness-defect",
    name: "NY POA Notary Signed as One of Two Witnesses",
    mode: "jurisdiction",
    state: "NY",
    description: "NY statutory short form where the notary public also signed as one of the two mandatory witnesses.",
    text: `NEW YORK STATUTORY DURABLE POWER OF ATTORNEY
Principal: Harold Finch. Agent: John Reese.
Signed: March 1, 2026.
Witness 1: Notary Public Samira Khan (serving both as notary and subscribing witness).
Witness 2: Walter White.
Acknowledgment before Notary Public Samira Khan.`,
    expectedOutcome: { maxScore: 50, mustContainRedFlag: "witness" },
  },
  {
    id: "case-04-chase-missing-banking-powers",
    name: "Chase POA Missing Explicit Banking Transactions",
    mode: "audit",
    bank: "Chase",
    description: "General POA submitted to JPMorgan Chase that only grants 'all general powers' without specifying banking transactions.",
    text: `GENERAL POWER OF ATTORNEY
I, Arthur Dent, grant my agent Ford Prefect full general power of attorney over all my affairs and property worldwide.
Executed under NY law on Jan 10, 2025. Notarized and witnessed.
No specific banking transaction clauses included.`,
    expectedOutcome: { maxScore: 70, mustContainRedFlag: "banking" },
  },
  {
    id: "case-05-fidelity-missing-indemnification",
    name: "Fidelity Brokerage POA Missing Agent Indemnification",
    mode: "audit",
    bank: "Fidelity",
    description: "Broker-dealer POA submitted to Fidelity lacking custodian indemnification and arbitration consent.",
    text: `FINANCIAL POWER OF ATTORNEY
Principal: Bruce Wayne. Agent: Alfred Pennyworth.
Authority over brokerage accounts, trading, margin, options.
State of New York. Executed Dec 1, 2024.
Lacks third-party hold-harmless and indemnification clause for broker-dealer transactions.`,
    expectedOutcome: { maxScore: 75, mustContainRedFlag: "indemnif" },
  },
  {
    id: "case-06-bofa-missing-durability-clause",
    name: "Bank of America Non-Durable POA",
    mode: "audit",
    bank: "Bank of America",
    description: "POA lacking the express durability provision ('This power of attorney shall not be affected by subsequent disability or incapacity').",
    text: `GENERAL POWER OF ATTORNEY
Principal: Clark Kent. Agent: Lois Lane.
I grant Lois Lane power to conduct my banking affairs at Bank of America.
[Clause states: This instrument is valid until revoked by me in writing. No durability clause included.]
Date: Oct 5, 2023. Notarized.`,
    expectedOutcome: { maxScore: 45, mustContainRedFlag: "durable" },
  },
  {
    id: "case-07-vanguard-missing-institutional-form",
    name: "Vanguard Third-Party Generic POA",
    mode: "audit",
    bank: "Vanguard",
    description: "Generic third-party POA submitted to Vanguard without using Vanguard's proprietary Agent Authorization form.",
    text: `DURABLE FINANCIAL POWER OF ATTORNEY
Principal: Peter Parker. Agent: May Parker.
Grants general authority over mutual funds and securities accounts.
Executed under NY statutory provisions. Vanguard institutional form not signed.`,
    expectedOutcome: { maxScore: 75, mustContainRedFlag: "form" },
  },
  {
    id: "case-08-ca-compliant-statutory",
    name: "California Statutory Short Form (Compliant)",
    mode: "jurisdiction",
    state: "CA",
    description: "California Uniform Statutory Form Power of Attorney (Cal. Prob. Code § 4401) acknowledged before notary public.",
    text: `UNIFORM STATUTORY FORM POWER OF ATTORNEY (CALIFORNIA PROBATE CODE SECTION 4401)
NOTICE: THE POWERS GRANTED BY THIS DOCUMENT ARE BROAD AND SWEEPING.
Principal: Diana Prince, Los Angeles, CA.
Agent: Steve Trevor, Los Angeles, CA.
Grant of authority: Real estate, tangible personal property, banking and financial institution transactions, business operations.
This power of attorney is durable and will continue to be effective if I become disabled, incapacitated, or incompetent.
Date: Jan 20, 2026.
State of California, County of Los Angeles. Subscribed and sworn to before me on Jan 20, 2026 by Diana Prince. Notary Public Seal.`,
    expectedOutcome: { minScore: 90, expectedStatus: "compliant" },
  },
  {
    id: "case-09-ca-unauthorized-gifting",
    name: "California POA Unauthorized Gifting Violation",
    mode: "audit",
    bank: "Wells Fargo",
    state: "CA",
    description: "California POA where agent attempts large gifts and beneficiary designations without express Cal. Prob. Code § 4264 authority.",
    text: `CALIFORNIA DURABLE POWER OF ATTORNEY
Principal: Charles Xavier. Agent: Jean Grey.
General banking authority granted.
Agent claims authority to make $100,000 gifts and change life insurance beneficiaries, but document does not expressly grant § 4264 powers.`,
    expectedOutcome: { maxScore: 65, mustContainRedFlag: "gift" },
  },
  {
    id: "case-10-fl-single-witness-defect",
    name: "Florida POA with Only One Subscribing Witness",
    mode: "jurisdiction",
    state: "FL",
    description: "Florida durable POA executed with only 1 witness, violating Fla. Stat. § 709.2105 mandatory 2-witness requirement.",
    text: `FLORIDA DURABLE POWER OF ATTORNEY
Principal: Tony Stark, Miami, FL. Agent: James Rhodes.
Full banking and financial authority.
Date: Jan 10, 2026.
Signed by Principal Tony Stark.
Witness 1: Pepper Potts.
[No second witness signature].
State of Florida, County of Miami-Dade. Acknowledged before notary public.`,
    expectedOutcome: { maxScore: 50, mustContainRedFlag: "witness" },
  },
  {
    id: "case-11-fl-springing-poa-invalid",
    name: "Florida Springing POA Executed in 2025",
    mode: "jurisdiction",
    state: "FL",
    description: "Florida POA with springing clause executed after Oct 1, 2011, which is void under Fla. Stat. § 709.2108.",
    text: `FLORIDA POWER OF ATTORNEY
Principal: Natasha Romanoff. Agent: Clint Barton.
Clause 3: "This Power of Attorney shall become effective only upon the written certification of two licensed physicians stating I have become incapacitated (springing)."
Date of Execution: May 12, 2025. Two witnesses and notary.`,
    expectedOutcome: { maxScore: 40, mustContainRedFlag: "springing" },
  },
  {
    id: "case-12-tx-outdated-statutory-notice",
    name: "Texas POA Missing 2017 Updated Statutory Notice",
    mode: "jurisdiction",
    state: "TX",
    description: "Texas statutory durable POA that omits the updated disclosure notices enacted under Tex. Est. Code § 752.051.",
    text: `STATUTORY DURABLE POWER OF ATTORNEY - TEXAS
Principal: Hank Pym, Austin, TX. Agent: Janet Van Dyne.
Old form from 2010 lacking modern statutory warnings and agent fiduciary disclosure.
Signed and notarized in 2024.`,
    expectedOutcome: { maxScore: 75, mustContainRedFlag: "notice" },
  },
  {
    id: "case-13-stale-poa-staleness-friction",
    name: "15-Year-Old Stale POA Facing Internal Bank Friction",
    mode: "audit",
    bank: "Wells Fargo",
    description: "Legally valid durable POA executed in 2011, but facing high friction due to bank's 5-year staleness policy.",
    text: `DURABLE POWER OF ATTORNEY
Principal: Barry Allen. Agent: Iris West.
Executed under Ohio law on October 4, 2011.
Properly notarized and witnessed.
Presented to Wells Fargo in 2026 (15 years old).`,
    expectedOutcome: { maxScore: 70, mustContainRedFlag: "stale" },
  },
  {
    id: "case-14-rejection-missing-gifts-rider",
    name: "Wells Fargo Rejection Diagnosis: Missing Gifting Rider",
    mode: "diagnosis",
    bank: "Wells Fargo",
    description: "Rejection diagnosis matching bank's notice of rejection regarding lack of express gifting authority.",
    text: `POWER OF ATTORNEY
Principal: Luke Skywalker. Agent: Leia Organa.
General power over banking transactions. No statutory gifts rider attached.`,
    rejectionText: `WELLS FARGO LEGAL ORDER PROCESSING - NOTICE OF REFUSAL
Account Holder: Luke Skywalker.
We cannot honor the Power of Attorney dated Jan 10, 2025 for requested gifting transfer.
Reason: Under New York General Obligations Law § 5-1514 and Wells Fargo policy, authority to make gifts in excess of $5,000 annually requires an express Statutory Gifts Rider or modification.`,
    expectedOutcome: { mustContainRedFlag: "gift" },
  },
  {
    id: "case-15-rejection-schwab-indemnification",
    name: "Charles Schwab Rejection: Lack of Brokerage Indemnification",
    mode: "diagnosis",
    bank: "Charles Schwab",
    description: "Rejection diagnosis for brokerage refusal due to lack of standard indemnification and trading authorization.",
    text: `GENERAL POWER OF ATTORNEY
Principal: Matt Murdock. Agent: Foggy Nelson.
Grants broad financial management authority.`,
    rejectionText: `CHARLES SCHWAB & CO., INC. - POA REVIEW DEPARTMENT
Notice of Incomplete Power of Attorney Documentation.
We have reviewed the Power of Attorney for Matt Murdock. We cannot grant agent trading privileges on the brokerage account.
Reason: The document does not contain an agreement to hold Charles Schwab harmless from acts performed by the attorney-in-fact, nor does it contain margin trading authorization.`,
    expectedOutcome: { mustContainRedFlag: "indemnif" },
  },
];

async function createSyntheticPdf(text: string, title: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();

  page.drawText(title, {
    x: 50,
    y: height - 50,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.3),
  });

  const lines = text.split("\n");
  let y = height - 80;

  for (const line of lines) {
    if (y < 50) break;
    // Word wrap simple
    const words = line.split(" ");
    let curLine = "";
    for (const w of words) {
      if ((curLine + " " + w).length > 70) {
        page.drawText(curLine, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 14;
        curLine = w;
      } else {
        curLine = curLine ? curLine + " " + w : w;
      }
    }
    if (curLine) {
      page.drawText(curLine, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 16;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function generateAllCases() {
  const outDir = path.resolve(process.cwd(), "evals", "cases");
  await fs.mkdir(outDir, { recursive: true });

  console.log(`Generating 15 synthetic eval cases in ${outDir}...`);

  for (const item of CASES) {
    const pdfBuffer = await createSyntheticPdf(item.text, item.name);
    const pdfPath = path.join(outDir, `${item.id}.pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);

    let rejectionPdfPath: string | undefined;
    if (item.rejectionText) {
      const rejBuffer = await createSyntheticPdf(item.rejectionText, `REJECTION NOTICE: ${item.name}`);
      rejectionPdfPath = path.join(outDir, `${item.id}-rejection.pdf`);
      await fs.writeFile(rejectionPdfPath, rejBuffer);
    }

    const jsonPath = path.join(outDir, `${item.id}.json`);
    await fs.writeFile(
      jsonPath,
      JSON.stringify(
        {
          ...item,
          pdfFile: path.basename(pdfPath),
          rejectionFile: rejectionPdfPath ? path.basename(rejectionPdfPath) : undefined,
        },
        null,
        2
      )
    );
  }

  console.log(`Successfully generated 15 test cases.`);
}

if (process.argv[1] && process.argv[1].endsWith("generate-eval-cases.ts")) {
  generateAllCases()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to generate eval cases:", err);
      process.exit(1);
    });
}
