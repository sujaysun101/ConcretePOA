import { Bank, BankRequirement } from "./types";

export const BANK_REQUIREMENTS: BankRequirement[] = [
  {
    bank: 'Chase',
    clauses: ['Durability Clause (explicit)', 'Indemnification of Bank'],
    formatting: ['Standard Notary Block', 'No handwritten alterations'],
    ageLimitations: 'Stale if older than 10 years without re-certification',
    highFrictionRules: ['Requires specific "Super Powers" language for beneficiary changes', 'Strict verification of Notary commission status']
  },
  {
    bank: 'Wells Fargo',
    clauses: ['Specific Banking Powers (Section 4)', 'Agent Affidavit'],
    formatting: ['Clear Principal Signature', 'Two Witness Signatures (preferred)'],
    ageLimitations: 'Prefers documents executed within last 5 years',
    highFrictionRules: ['Often rejects general "all powers" clauses without specific banking enumeration', 'Requires separate Agent Acceptance form']
  },
  {
    bank: 'Fidelity',
    clauses: ['Indemnification of Fidelity', 'Arbitration Clause'],
    formatting: ['Proprietary form preferred', 'Medallion Signature Guarantee (for some transfers)'],
    ageLimitations: 'No strict age limit, but "stale" docs trigger manual legal review',
    highFrictionRules: ['Extremely strict on "Gifting" powers', 'Requires specific language for IRA beneficiary changes']
  },
  {
    bank: 'Schwab',
    clauses: ['Limited Trading Authorization', 'Full Power of Attorney'],
    formatting: ['Digital signatures often rejected for initial setup', 'Wet ink required'],
    ageLimitations: 'Documents > 7 years old require "Affidavit of Full Force and Effect"',
    highFrictionRules: ['Requires explicit "Discretionary Authority" for managed accounts', 'Strict check on Agent\'s SSN/ID verification']
  },
  {
    bank: 'Vanguard',
    clauses: ['Vanguard-specific Indemnification', 'Electronic Delivery Consent'],
    formatting: ['Proprietary "Vanguard POA" form almost always required', 'Notary required'],
    ageLimitations: 'Highly prefers their own form executed within 3 years',
    highFrictionRules: ['General POAs often sent to "Legal Escalation" (3-4 week delay)', 'Requires specific "Trustee" powers for trust-owned accounts']
  },
  {
    bank: 'Bank of America',
    clauses: ['Durability Clause', 'Specific Real Estate Powers'],
    formatting: ['Standard State Statutory Form preferred', 'Clear Notary Seal'],
    ageLimitations: 'Docs > 10 years old may require re-execution',
    highFrictionRules: ['Strict on "Successor Agent" transition proof', 'Requires specific "Banking Transactions" power']
  },
  {
    bank: 'Citi',
    clauses: ['Specific Banking Powers', 'Principal Signature Verification'],
    formatting: ['Clear Notary Seal', 'No handwritten edits'],
    ageLimitations: 'Stale after 10 years',
    highFrictionRules: ['Requires specific "Super Powers" for gifting', 'Strict on Notary commission status']
  },
  {
    bank: 'PNC',
    clauses: ['Estate Intake Requirements', 'Specific Banking Powers'],
    formatting: ['Standard Notary Block', 'Clear Principal Signature'],
    ageLimitations: 'Prefers docs within last 5 years',
    highFrictionRules: ['Strict on "Successor Agent" verification', 'Requires specific "Banking Transactions" power']
  },
  {
    bank: 'Truist',
    clauses: ['Witness Count (2 required)', 'Indemnification'],
    formatting: ['Clear Notary Seal', 'Wet ink signatures'],
    ageLimitations: 'Docs > 7 years old trigger review',
    highFrictionRules: ['Strict on Florida-specific witness requirements', 'Requires specific "Gifting" powers']
  },
  {
    bank: 'Capital One',
    clauses: ['Indemnification Clause', 'Durability Clause'],
    formatting: ['Digital signatures often rejected', 'Clear Notary Block'],
    ageLimitations: 'No strict limit, but docs > 10 years trigger review',
    highFrictionRules: ['Strict on "Agent Acceptance" forms', 'Requires specific "Banking Powers"']
  },
  {
    bank: 'TD Bank',
    clauses: ['Statutory Form Preferred', 'Specific Banking Powers'],
    formatting: ['No handwritten alterations', 'Clear Notary Seal'],
    ageLimitations: 'Docs > 10 years old require re-execution',
    highFrictionRules: ['Strict on "Successor Agent" transition proof', 'Requires specific "Banking Transactions" power']
  },
  {
    bank: 'Goldman Sachs',
    clauses: ['Marcus-specific Indemnification', 'Arbitration Clause'],
    formatting: ['Wet ink signatures preferred', 'Clear Notary Block'],
    ageLimitations: 'Docs > 5 years old trigger review',
    highFrictionRules: ['Strict on "Gifting" powers', 'Requires specific language for IRA beneficiary changes']
  },
  {
    bank: 'BNY Mellon',
    clauses: ['Wealth Management Specific Clauses', 'Indemnification'],
    formatting: ['Clear Notary Seal', 'Professional formatting required'],
    ageLimitations: 'Docs > 7 years old trigger review',
    highFrictionRules: ['Strict on "Discretionary Authority"', 'Requires specific "Trustee" powers']
  },
  {
    bank: 'State Street',
    clauses: ['Institutional Specific Clauses', 'Indemnification'],
    formatting: ['Clear Notary Block', 'Wet ink signatures'],
    ageLimitations: 'Docs > 10 years old trigger review',
    highFrictionRules: ['Strict on "Agent\'s SSN/ID verification"', 'Requires specific "Banking Transactions" power']
  },
  {
    bank: 'U.S. Bank',
    clauses: ['Military POA Acceptance Rules', 'Specific Banking Powers'],
    formatting: ['Clear Notary Seal', 'No handwritten edits'],
    ageLimitations: 'Docs > 10 years old trigger review',
    highFrictionRules: ['Strict on "Successor Agent" verification', 'Requires specific "Banking Transactions" power']
  }
];
