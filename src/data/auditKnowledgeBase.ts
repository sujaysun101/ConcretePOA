/**
 * Curated knowledge for prompt injection (not model training).
 * Sources: public summaries of UPOAA-style norms, institutional banking practices described in compliance literature,
 * and project-internal rubrics. This is not legal advice; the app assists review only.
 */
import { BANK_REQUIREMENTS } from '../constants';

/** Serialized bank rubric used by audit + jurisdiction prompts. */
export function bankRubricJson(): string {
  return JSON.stringify(BANK_REQUIREMENTS, null, 2);
}

/** High-level state checklist hints (verify against current statutes before relying on outputs). */
export const JURISDICTION_HINTS: Record<
  string,
  { topics: string[]; notes: string }
> = {
  CA: {
    topics: [
      'Statutory short form vs custom long form',
      'Witness / notary rules depending on form type',
      'Springing vs immediate durability wording',
      'Agent duties and gifting / trust creation limitations where applicable',
    ],
    notes: 'California has detailed POA statutes; compare execution block to current published court / bar guidance.',
  },
  NY: {
    topics: [
      'Statutory gifts rider if gifting beyond incidental gifts',
      'Separate banking / securities institutions may require specific powers enumerated',
      'Two disinterested witnesses for certain statutory forms',
    ],
    notes: 'NY statutory short form and modifications are common friction points for broker-dealers.',
  },
  FL: {
    topics: [
      'Two witnesses + notary for durable POA execution (typical pattern)',
      'Specific super-powers (certain trust / beneficiary changes) if granted',
      'Agent acceptance / authority acknowledgment where used',
    ],
    notes: 'Florida institutions often scrutinize witness count and notary block.',
  },
  TX: {
    topics: [
      'Statutory durable POA notices to principal',
      'Specific grants for real property vs financial accounts',
      'Recording when used for real estate',
    ],
    notes: 'Texas durable POA notices are a common statutory drift vector.',
  },
  IL: {
    topics: [
      'Illinois Statutory Short Form Power of Attorney for Property',
      'Witness requirements (one disinterested witness)',
      'Agent certification and acceptance',
      'Specific powers for real estate, banking, and investment management',
    ],
    notes: 'Illinois revised its statutory short form in 2012; verify which version governs. Agent certification page is mandatory for some institutions.',
  },
  PA: {
    topics: [
      'Two witnesses + notary required under 2015 revisions',
      'Notice to principal (verbatim statutory language)',
      'Agent acknowledgment form',
      'Specific powers for financial institutions vs real property',
    ],
    notes: 'Pennsylvania overhauled its POA law in 2015. Older documents may lack the mandated notices and agent acknowledgment. High friction at banks for pre-2015 docs.',
  },
  OH: {
    topics: [
      'Durable language explicit ("not affected by disability")',
      'Notary acknowledgment per ORC Chapter 1337',
      'Agent acceptance for Ohio statutory form',
      'Recording requirements for real property transactions',
    ],
    notes: 'Ohio adopted a modernized UPOAA-based statute; verify execution formalities match the version in effect at execution.',
  },
  GA: {
    topics: [
      'Two witnesses + notary required',
      'Specific banking powers enumerated',
      'Self-proving affidavit for ease of acceptance',
      'Gifts to agent restrictions',
    ],
    notes: 'Georgia institutions are strict about the two-witness requirement; a single witness makes the document vulnerable to rejection.',
  },
  WA: {
    topics: [
      'Washington adopted UPOAA with modifications',
      'Notice requirement if statutory form used',
      'Agent\'s certificate of authority',
      'Community property considerations for married principals',
    ],
    notes: 'Washington community property rules create additional complexity when agent acts on accounts that may be community property.',
  },
  Generic: {
    topics: [
      'Identify governing law clause',
      'Principal / agent / successor naming clarity',
      'Durability language and effective date',
      'Notary + witness integrity',
    ],
    notes: 'Use when state is unknown or document lists multiple jurisdictions.',
  },
};

/** Few-shot style examples: model should mimic analytical depth, not copy text. */
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

export function jurisdictionHintsBlock(): string {
  return JSON.stringify(JURISDICTION_HINTS, null, 2);
}
