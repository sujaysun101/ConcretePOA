import os
import pytest
from extractor import FieldExtractor
from engine import RulesEngine
from reader import DocumentReader

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "poa50")
SAMPLE_01 = os.path.join(FIXTURES_DIR, "50_samples", "01_NY_Conservative_Banking.docx")


def get_base_ny_text():
    if not os.path.exists(SAMPLE_01):
        pytest.skip(f"Missing sample: {SAMPLE_01}")
    reader = DocumentReader()
    with open(SAMPLE_01, "rb") as f:
        text, _ = reader.read_document(f.read(), "01_NY_Conservative_Banking.docx")
    return text


def test_synthetic_defects_assert_rules_fire():
    base_text = get_base_ny_text()
    extractor = FieldExtractor()
    engine = RulesEngine()

    # Baseline text has placeholder clauses and triggers blockers
    base_fields = extractor.extract(base_text)
    base_violations = engine.evaluate(base_fields)
    assert any(v.rule_id == "NY-EXEC-001" for v in base_violations), "Caution violation must fire"
    assert any(v.rule_id == "NY-EXEC-002" for v in base_violations), "Witness violation must fire"
    assert any(v.rule_id == "NY-EXEC-003" for v in base_violations), "Notary violation must fire"
    assert any(v.rule_id == "NY-EXEC-004" for v in base_violations), "Agent acceptance violation must fire"

    # Synthetic Test 1: Complete the Notary and Witness blocks, but delete Agent Acceptance
    # Assert NY-EXEC-004 still fires
    no_agent_text = base_text.replace("C. AGENT ACCEPTANCE AND ACKNOWLEDGMENT", "C. [REMOVED]")
    no_agent_text = no_agent_text.replace("AGENT ACCEPTANCE", "")
    no_agent_text = no_agent_text.replace("ACCEPTANCE OF APPOINTMENT", "")
    fields = extractor.extract(no_agent_text)
    violations = engine.evaluate(fields)
    assert any(v.rule_id == "NY-EXEC-004" for v in violations)

    # Synthetic Test 2: Add Springing incapacity trigger
    # Assert NY-EXEC-006 (warning) fires
    springing_text = base_text.replace(
        "The authority is intended to commence upon execution of a valid instrument.",
        "Authority is intended to commence only after incapacity has been determined by two physicians.",
    )
    fields = extractor.extract(springing_text)
    violations = engine.evaluate(fields)
    assert any(v.rule_id == "NY-EXEC-006" for v in violations)

    # Synthetic Test 3: Request broad gifting authority
    # Assert NY-EXEC-005 (warning) fires
    gifting_text = base_text.replace(
        "NO GIFTING AUTHORITY IS GRANTED. Agent shall not make gifts, forgive debts, transfer assets for less than reasonably equivalent value, or make gifts to Agent.",
        "SPECIAL EXPRESS AUTHORITY FOR GIFTS: Agent may make Annual-exclusion gifts to spouse and descendants; no agent gifts.",
    )
    fields = extractor.extract(gifting_text)
    violations = engine.evaluate(fields)
    assert any(v.rule_id == "NY-EXEC-005" for v in violations)
