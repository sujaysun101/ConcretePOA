import csv
import os
import pytest
from tabulate import tabulate

from reader import DocumentReader
from extractor import FieldExtractor
from engine import RulesEngine


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "poa50")
INDEX_PATH = os.path.join(FIXTURES_DIR, "INDEX.csv")
SAMPLES_DIR = os.path.join(FIXTURES_DIR, "50_samples")


def load_dataset():
    if not os.path.exists(INDEX_PATH):
        pytest.skip(f"Test fixture not found: {INDEX_PATH}")
    items = []
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append(row)
    return items


def test_field_extraction_accuracy_and_ny_blockers():
    samples = load_dataset()
    reader = DocumentReader()
    extractor = FieldExtractor()
    engine = RulesEngine()

    total = len(samples)
    correct_state = 0
    correct_effective = 0
    correct_gifting = 0
    correct_beneficiary = 0
    correct_successor = 0

    ny_samples_tested = 0
    ny_samples_with_blocker = 0

    for item in samples:
        filename = item["filename"]
        file_path = os.path.join(SAMPLES_DIR, filename)
        if not os.path.exists(file_path):
            continue

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        text, _ = reader.read_document(file_bytes, filename)
        fields = extractor.extract(text)

        # 1. State accuracy
        if fields.state.lower() == item["state"].lower():
            correct_state += 1

        # 2. Effective timing
        expected_effective = item["effective"]
        if expected_effective.lower().startswith("springing"):
            if fields.effective_type.lower().startswith("springing"):
                correct_effective += 1
        else:
            if fields.effective_type == "Immediate":
                correct_effective += 1

        # 3. Gifting
        expected_gifting = item["gifting"].lower()
        actual_gifting = fields.gifting_authority.lower()
        if expected_gifting == "no gifts" and actual_gifting == "no gifts":
            correct_gifting += 1
        elif "annual-exclusion" in expected_gifting and "annual-exclusion" in actual_gifting:
            correct_gifting += 1
        elif expected_gifting == actual_gifting:
            correct_gifting += 1

        # 4. Beneficiary changes
        expected_ben = item["beneficiary_changes"].lower().startswith("yes")
        if fields.beneficiary_changes == expected_ben:
            correct_beneficiary += 1

        # 5. Successor
        expected_succ = item["successor"].lower()
        has_succ = len(fields.successors) > 0
        if "one successor" in expected_succ and has_succ:
            correct_successor += 1
        elif "no successor" in expected_succ and not has_succ:
            correct_successor += 1

        # NY Blocker check: every NY sample has placeholder clauses, so MUST produce >= 1 blocker
        if item["state"].lower() == "new york":
            ny_samples_tested += 1
            violations = engine.evaluate(fields)
            blockers = [v for v in violations if v.severity == "blocker"]
            if len(blockers) >= 1:
                ny_samples_with_blocker += 1

    # Print accuracy table
    table_data = [
        ["State Identification", f"{correct_state}/{total}", f"{(correct_state/total)*100:.1f}%"],
        ["Effective / Springing", f"{correct_effective}/{total}", f"{(correct_effective/total)*100:.1f}%"],
        ["Gifting Authority", f"{correct_gifting}/{total}", f"{(correct_gifting/total)*100:.1f}%"],
        ["Beneficiary Changes", f"{correct_beneficiary}/{total}", f"{(correct_beneficiary/total)*100:.1f}%"],
        ["Successor Presence", f"{correct_successor}/{total}", f"{(correct_successor/total)*100:.1f}%"],
    ]

    print("\n" + "=" * 55)
    print("      POA 50-SAMPLE FIELD EXTRACTION ACCURACY")
    print("=" * 55)
    print(tabulate(table_data, headers=["Field", "Matches", "Accuracy"], tablefmt="grid"))
    print("\n" + "=" * 55)
    print(f"NY Samples Tested: {ny_samples_tested}")
    print(f"NY Samples with Blocker Violations: {ny_samples_with_blocker}/{ny_samples_tested}")
    print("=" * 55 + "\n")

    # Assertions
    assert correct_state == total, "State detection failed on some samples"
    assert (correct_effective / total) >= 0.90, "Effective timing accuracy below 90%"
    assert (correct_gifting / total) >= 0.90, "Gifting authority accuracy below 90%"
    assert (correct_successor / total) >= 0.80, "Successor detection accuracy below 80%"

    # Hard requirement: every NY sample must trigger at least one blocker
    assert ny_samples_tested > 0, "No NY samples were tested!"
    assert ny_samples_with_blocker == ny_samples_tested, (
        f"Expected ALL {ny_samples_tested} NY samples to fail with blockers, but only {ny_samples_with_blocker} did."
    )
