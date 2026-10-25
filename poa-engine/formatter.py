import time
import uuid
from typing import List
from schemas import (
    AuditResult,
    RemediationBlueprint,
    ExtractedData,
    JurisdictionResult,
    CautionSectionVerbatim,
    AgentSignaturePage,
    StatutoryDriftItem,
)
from extractor import ExtractedPOAFields
from engine import RuleViolation


def build_audit_result(
    fields: ExtractedPOAFields,
    violations: List[RuleViolation],
    bank_target: str = "Institutional Review",
) -> AuditResult:
    """Constructs the canonical AuditResult matching ConcretePOA Next.js schema."""
    case_id = str(uuid.uuid4())
    now = int(time.time() * 1000)

    # Compute acceptance probability score: start at 100, deduct 25 per blocker, 10 per warning
    score = 100
    red_flags = []
    execution_audits = []
    clause_audits = []

    for v in violations:
        if v.severity == "blocker":
            score -= 25
            red_flags.append(f"BLOCKER ({v.citation}): {v.title} — {v.evidence_span or v.description}")
            execution_audits.append(f"Non-compliant: {v.title} ({v.citation})")
        else:
            score -= 10
            clause_audits.append(f"Warning: {v.title} — {v.evidence_span or v.description}")

    score = max(0, min(100, score))

    if not red_flags:
        red_flags.append("Statutory execution formalities reviewed; attorney verification recommended.")

    action1 = "Remediate missing statutory notices and execution formalities with a licensed attorney."
    action2 = "Ensure agent signs and notarizes the statutory acceptance before submitting to institutions."
    if red_flags:
        action1 = f"Fix critical execution defects: {red_flags[0]}"

    blueprint = RemediationBlueprint(
        action1=action1,
        action2=action2,
        concreteFix="Replace placeholder clauses with current statutory provisions under the governing state code.",
        affidavitTemplate=(
            "AFFIDAVIT OF FULL FORCE AND EFFECT (DRAFT TEMPLATE — HAVE AN ATTORNEY REVIEW)\n\n"
            f"State of {fields.state or 'New York'}\n"
            "County of _______________\n\n"
            f"I, {fields.agents[0] if fields.agents else '[Agent Name]'}, being duly sworn, depose and state:\n"
            f"1. That {fields.principal or '[Principal Name]'} executed a power of attorney designating the undersigned as agent.\n"
            "2. That to my knowledge, the principal is alive and the power of attorney has not been revoked.\n"
            "3. That any condition precedent to the authority has been satisfied.\n\n"
            "Agent Signature: _______________________\n"
            "Subscribed and sworn before me this _____ day of ____________, 20____.\n"
            "Notary Public: _________________________"
        ),
    )

    extracted_data = ExtractedData(
        principal=fields.principal or "Unknown",
        agent=", ".join(fields.agents) if fields.agents else "Unknown",
        state=fields.state or "New York",
        date=fields.execution_date or "Unspecified",
        # Notice: per privacy requirements, we NEVER output raw document text in persistent production
        rawText=None,
    )

    return AuditResult(
        id=case_id,
        timestamp=now,
        bankTarget=bank_target,
        acceptanceProbability=score,
        primaryRedFlags=red_flags,
        clauseAudit=clause_audits if clause_audits else ["Standard fiduciary clauses present."],
        executionAudit=execution_audits if execution_audits else ["Execution formalities compliant."],
        remediationBlueprint=blueprint,
        extractedData=extracted_data,
    )


def build_jurisdiction_result(
    fields: ExtractedPOAFields,
    violations: List[RuleViolation],
) -> JurisdictionResult:
    """Constructs the canonical JurisdictionResult matching ConcretePOA Next.js schema."""
    case_id = str(uuid.uuid4())
    now = int(time.time() * 1000)

    caution_violation = next((v for v in violations if "Caution" in v.title), None)
    agent_violation = next((v for v in violations if "Agent" in v.title), None)

    caution_status = "missing" if caution_violation else "compliant"
    caution_drift = (
        caution_violation.evidence_span or caution_violation.description
        if caution_violation
        else "Substantially conforms to governing statutory notice."
    )

    agent_status = "missing" if agent_violation else "compliant"
    agent_drift = (
        agent_violation.evidence_span or agent_violation.description
        if agent_violation
        else "Agent statutory acknowledgment verified."
    )

    drift_items = [
        StatutoryDriftItem(
            title=v.title,
            description=v.evidence_span or v.description,
            severity="high" if v.severity == "blocker" else "medium",
            remediation=v.remediation,
        )
        for v in violations
    ]

    score = 100 - (len(violations) * 20)
    score = max(0, min(100, score))

    return JurisdictionResult(
        id=case_id,
        timestamp=now,
        state=fields.state or "New York",
        statutoryYear=2021 if "New York" in fields.state else 2020,
        cautionSectionVerbatim=CautionSectionVerbatim(
            status=caution_status,
            requiredText="CAUTION TO THE PRINCIPAL: Your Power of Attorney is an important document...",
            actualText=None,
            driftDetails=caution_drift,
        ),
        agentSignaturePage=AgentSignaturePage(
            status=agent_status,
            requirements="Agent must sign and notarize statutory acceptance prior to exercising powers.",
            driftDetails=agent_drift,
        ),
        statutoryDrift=drift_items,
        overallComplianceScore=score,
    )
