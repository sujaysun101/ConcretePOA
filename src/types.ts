export interface AuditResult {
  id: string;
  timestamp: number;
  bankTarget: string;
  acceptanceProbability: number;
  primaryRedFlags: string[];
  clauseAudit: string[];
  executionAudit: string[];
  remediationBlueprint: {
    action1: string;
    action2: string;
    concreteFix: string;
    affidavitTemplate: string;
  };
  extractedData: {
    principal: string;
    agent: string;
    state: string;
    date: string;
    rawText?: string;
  };
}

export interface RejectionDiagnosis {
  id: string;
  timestamp: number;
  bankName: string;
  rejectionReason: string;
  legaleseTranslation: string;
  poaConflictSection: string;
  actionPlan: {
    step1: string;
    step2: string;
    step3: string;
  };
  remediationText: string;
}

export interface JurisdictionResult {
  id: string;
  timestamp: number;
  state: string;
  statutoryYear: number;
  cautionSectionVerbatim: {
    status: 'compliant' | 'non-compliant' | 'missing';
    requiredText: string;
    actualText?: string;
    driftDetails: string;
  };
  agentSignaturePage: {
    status: 'compliant' | 'non-compliant' | 'missing';
    requirements: string;
    driftDetails: string;
  };
  statutoryDrift: {
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    remediation: string;
  }[];
  overallComplianceScore: number;
}

export type Bank = 'Chase' | 'Wells Fargo' | 'Fidelity' | 'Schwab' | 'Vanguard' | 'Bank of America' | 'Citi' | 'PNC' | 'Truist' | 'Capital One' | 'TD Bank' | 'Goldman Sachs' | 'BNY Mellon' | 'State Street' | 'U.S. Bank' | 'Other' | string;

export interface BankRequirement {
  bank: string;
  clauses: string[];
  formatting: string[];
  ageLimitations: string;
  highFrictionRules: string[];
}
