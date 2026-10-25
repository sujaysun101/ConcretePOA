from typing import List, Optional
from pydantic import BaseModel, Field


class RemediationBlueprint(BaseModel):
    action1: str
    action2: str
    concreteFix: str
    affidavitTemplate: str


class ExtractedData(BaseModel):
    principal: str = ""
    agent: str = ""
    state: str = ""
    date: str = ""
    rawText: Optional[str] = None


class AuditResult(BaseModel):
    id: str
    timestamp: int
    bankTarget: str
    acceptanceProbability: int = Field(ge=0, le=100)
    primaryRedFlags: List[str] = Field(default_factory=list)
    clauseAudit: List[str] = Field(default_factory=list)
    executionAudit: List[str] = Field(default_factory=list)
    remediationBlueprint: RemediationBlueprint
    extractedData: ExtractedData


class ActionPlan(BaseModel):
    step1: str
    step2: str
    step3: str


class RejectionDiagnosis(BaseModel):
    id: str
    timestamp: int
    bankName: str
    rejectionReason: str
    legaleseTranslation: str
    poaConflictSection: str
    actionPlan: ActionPlan
    remediationText: str


class CautionSectionVerbatim(BaseModel):
    status: str
    requiredText: str
    actualText: Optional[str] = None
    driftDetails: str


class AgentSignaturePage(BaseModel):
    status: str
    requirements: str
    driftDetails: str


class StatutoryDriftItem(BaseModel):
    title: str
    description: str
    severity: str
    remediation: str


class JurisdictionResult(BaseModel):
    id: str
    timestamp: int
    state: str
    statutoryYear: int
    cautionSectionVerbatim: CautionSectionVerbatim
    agentSignaturePage: AgentSignaturePage
    statutoryDrift: List[StatutoryDriftItem] = Field(default_factory=list)
    overallComplianceScore: int = Field(ge=0, le=100)
