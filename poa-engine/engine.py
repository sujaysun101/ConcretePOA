import os
import yaml
from typing import Dict, List, Optional
from pydantic import BaseModel
from extractor import ExtractedPOAFields


class RuleViolation(BaseModel):
    rule_id: str
    title: str
    citation: str
    severity: str  # blocker, warning, info
    description: str
    remediation: str
    evidence_span: Optional[str] = None


class RuleDefinition(BaseModel):
    id: str
    title: str
    citation: str
    severity: str
    check_type: str
    description: str
    remediation: str


class RulesEngine:
    """Loads declarative statutory rules and executes deterministic compliance checks."""

    def __init__(self, rules_dir: Optional[str] = None):
        if not rules_dir:
            rules_dir = os.path.join(os.path.dirname(__file__), "rules")
        self.rules_dir = rules_dir
        self.rules_cache: Dict[str, List[RuleDefinition]] = {}
        self._load_all_rules()

    def _load_all_rules(self):
        if not os.path.exists(self.rules_dir):
            return
        for file in os.listdir(self.rules_dir):
            if file.endswith(".yaml") or file.endswith(".yml"):
                jurisdiction = file.split(".")[0].lower()
                path = os.path.join(self.rules_dir, file)
                with open(path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    rules = [RuleDefinition(**r) for r in data.get("rules", [])]
                    self.rules_cache[jurisdiction] = rules

    def evaluate(self, fields: ExtractedPOAFields) -> List[RuleViolation]:
        state_key = fields.state.lower().replace(" ", "")
        if "newyork" in state_key or "ny" in state_key:
            return self._evaluate_ny(fields)
        # Default or fallback evaluation for other jurisdictions
        return []

    def _evaluate_ny(self, fields: ExtractedPOAFields) -> List[RuleViolation]:
        violations = []
        rules = self.rules_cache.get("ny", [])

        for rule in rules:
            if rule.check_type == "statutory_caution":
                # Check NY GOL § 5-1513 Caution Notice
                if not fields.statutory_notices_present:
                    evidence = (
                        "Document contains educational insert placeholder instead of statutory notice: "
                        "[STATUTORY CAUTION TO PRINCIPAL / NOTICE / AGENT INFORMATION...]"
                        if "[STATUTORY CAUTION" in fields.raw_text.upper()
                        else "Missing statutory Caution to the Principal notice required by NY GOL § 5-1513."
                    )
                    violations.append(
                        RuleViolation(
                            rule_id=rule.id,
                            title=rule.title,
                            citation=rule.citation,
                            severity=rule.severity,
                            description=rule.description,
                            remediation=rule.remediation,
                            evidence_span=evidence,
                        )
                    )

            elif rule.check_type == "witness_execution":
                # Check 2 disinterested witnesses under NY GOL § 5-1501B(1)(b)
                if fields.witness_count < 2 or fields.witnesses_are_placeholders:
                    evidence = (
                        f"Found {fields.witness_count} witnesses with placeholder signature lines"
                        if fields.witnesses_are_placeholders
                        else f"Found only {fields.witness_count} witness(es); New York requires two disinterested witnesses."
                    )
                    violations.append(
                        RuleViolation(
                            rule_id=rule.id,
                            title=rule.title,
                            citation=rule.citation,
                            severity=rule.severity,
                            description=rule.description,
                            remediation=rule.remediation,
                            evidence_span=evidence,
                        )
                    )

            elif rule.check_type == "principal_acknowledgment":
                # Check Notarial Acknowledgment under NY GOL § 5-1501B(1)(a)
                if not fields.notary_block_present or fields.notary_is_placeholder:
                    evidence = (
                        "Found uncompleted placeholder: [STATE-COMPLIANT NOTARIAL ACKNOWLEDGMENT TO BE INSERTED VERBATIM FOR NEW YORK]"
                        if fields.notary_is_placeholder
                        else "Document lacks required New York notarial certificate of acknowledgment for principal."
                    )
                    violations.append(
                        RuleViolation(
                            rule_id=rule.id,
                            title=rule.title,
                            citation=rule.citation,
                            severity=rule.severity,
                            description=rule.description,
                            remediation=rule.remediation,
                            evidence_span=evidence,
                        )
                    )

            elif rule.check_type == "agent_acceptance":
                # Check Agent Acceptance under NY GOL § 5-1501B(2)
                if not fields.agent_acceptance_present or fields.agent_acceptance_is_placeholder:
                    evidence = (
                        "Agent acceptance contains placeholder lines: [INSERT ANY REQUIRED STATE-STATUTORY AGENT ACKNOWLEDGMENT OR NOTARY BLOCK]"
                        if fields.agent_acceptance_is_placeholder
                        else "No signed and notarized statutory agent acceptance present; agent cannot act until acknowledged."
                    )
                    violations.append(
                        RuleViolation(
                            rule_id=rule.id,
                            title=rule.title,
                            citation=rule.citation,
                            severity=rule.severity,
                            description=rule.description,
                            remediation=rule.remediation,
                            evidence_span=evidence,
                        )
                    )

            elif rule.check_type == "gifting_modification":
                # Check Gifting & Modifications under NY GOL § 5-1514
                if fields.gifting_authority != "No gifts":
                    if not fields.modifications_content or "[NONE" in fields.modifications_content:
                        violations.append(
                            RuleViolation(
                                rule_id=rule.id,
                                title=rule.title,
                                citation=rule.citation,
                                severity=rule.severity,
                                description=rule.description,
                                remediation=rule.remediation,
                                evidence_span=f"Gifting power requested ('{fields.gifting_authority}') without explicit statutory terms in Modifications section.",
                            )
                        )

            elif rule.check_type == "springing_trigger":
                # Check Springing trigger under NY GOL § 5-1501B(3)
                if fields.effective_type == "Springing upon incapacity":
                    evidence = "Springing authority designated without objective physician certification trigger clause."
                    violations.append(
                        RuleViolation(
                            rule_id=rule.id,
                            title=rule.title,
                            citation=rule.citation,
                            severity=rule.severity,
                            description=rule.description,
                            remediation=rule.remediation,
                            evidence_span=evidence,
                        )
                    )

        return violations
