export type CaseKind = "audit" | "diagnosis" | "jurisdiction";
export type Severity = "high" | "medium" | "low";
export type ComplianceStatus = "compliant" | "non-compliant" | "missing";

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
    status: ComplianceStatus;
    requiredText: string;
    actualText?: string;
    driftDetails: string;
  };
  agentSignaturePage: {
    status: ComplianceStatus;
    requirements: string;
    driftDetails: string;
  };
  statutoryDrift: {
    title: string;
    description: string;
    severity: Severity;
    remediation: string;
  }[];
  overallComplianceScore: number;
}

export type Findings = AuditResult | RejectionDiagnosis | JurisdictionResult;

export interface CaseRecord {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  kind: CaseKind;
  status: "ready" | "sample";
  bankTarget: string | null;
  state: string | null;
  principal: string | null;
  agent: string | null;
  executionDate: string | null;
  fileName: string | null;
  score: number | null;
  summary: string;
  findings: Findings;
  isDemo: boolean;
  isSample: boolean;
  createdAt: string;
}

export interface RuleRecord {
  id: string;
  orgId: string | null;
  scope: "jurisdiction" | "institution";
  jurisdiction: string | null;
  institution: string | null;
  topic: string;
  requirement: string;
  severity: Severity;
  citation: string | null;
  notes: string | null;
  year: number | null;
  custom: boolean;
}

export interface DashboardData {
  mode: "postgres" | "memory";
  totals: {
    cases: number;
    audits: number;
    diagnoses: number;
    jurisdiction: number;
    avgScore: number | null;
    atRisk: number;
  };
  byMonth: { month: string; cases: number; avgScore: number | null }[];
  byBank: { bank: string; cases: number; avgScore: number | null }[];
  byState: { state: string; cases: number }[];
  recent: CaseRecord[];
  priority: CaseRecord | null;
  hotspots: { label: string; count: number }[];
}

export interface BankRequirement {
  bank: string;
  clauses: string[];
  formatting: string[];
  ageLimitations: string;
  highFrictionRules: string[];
}
