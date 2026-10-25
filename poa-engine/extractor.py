import re
from typing import List, Optional
from pydantic import BaseModel


class ExtractedPOAFields(BaseModel):
    state: str = "Unknown"
    principal: str = ""
    agents: List[str] = []
    successors: List[str] = []
    execution_date: str = ""
    effective_type: str = "Immediate"  # Immediate, Springing upon incapacity, Unknown
    notary_block_present: bool = False
    notary_is_placeholder: bool = False
    witness_count: int = 0
    witnesses_are_placeholders: bool = False
    agent_acceptance_present: bool = False
    agent_acceptance_is_placeholder: bool = False
    modifications_content: Optional[str] = None
    gifting_authority: str = "No gifts"
    beneficiary_changes: bool = False
    hot_powers: List[str] = []
    statutory_notices_present: bool = False
    raw_text: str = ""


class FieldExtractor:
    """Extracts structural and legal elements from POA text using robust heuristics & regex."""

    def extract(self, text: str) -> ExtractedPOAFields:
        fields = ExtractedPOAFields(raw_text=text)

        # 1. State detection
        state_match = re.search(
            r"\b(New York|California|Texas|Florida|Pennsylvania)\b",
            text[:2000],
            re.IGNORECASE,
        )
        if state_match:
            fields.state = state_match.group(1).title()
        elif "NY" in text[:1500] or "N.Y." in text[:1500] or "GOL" in text:
            fields.state = "New York"
        elif "CA" in text[:1500] or "Probate Code" in text:
            fields.state = "California"
        elif "TX" in text[:1500] or "Estates Code" in text:
            fields.state = "Texas"
        elif "FL" in text[:1500] or "Florida Statutes" in text:
            fields.state = "Florida"
        elif "PA" in text[:1500] or "Title 20" in text:
            fields.state = "Pennsylvania"

        # 2. Principal name
        p_match = re.search(
            r"I,\s+([A-Z][A-Za-z0-9\s\.\-]{2,40}),\s+residing at.*?\(?[\"']?Principal[\"']?\)?",
            text,
            re.IGNORECASE,
        )
        if p_match:
            fields.principal = p_match.group(1).strip()
        else:
            p_print = re.search(r"Printed name:\s*([A-Za-z0-9\s\.\-]{2,40})", text)
            if p_print:
                fields.principal = p_print.group(1).strip()

        # 3. Agent name(s)
        a_match = re.search(
            r"designate\s+([A-Z][A-Za-z0-9\s\.\-]{2,40}),\s+residing at.*?\(?[\"']?Agent[\"']?\)?",
            text,
            re.IGNORECASE,
        )
        if a_match:
            fields.agents = [a_match.group(1).strip()]
        else:
            a_line = re.search(r"Agent:\s*([A-Za-z0-9\s\.\-]{2,40})", text)
            if a_line:
                fields.agents = [a_line.group(1).strip()]

        # 4. Successor agent(s)
        # Check explicitly for "No successor agent is designated"
        if re.search(r"No\s+successor\s+agent\s+is\s+designated|no\s+successor\s+agent", text, re.IGNORECASE):
            fields.successors = []
        else:
            s_match = re.search(
                r"designate\s+([A-Z][A-Za-z0-9\s\.\-]{2,40}),\s+residing at.*?(?:as\s+)?successor\s+Agent",
                text,
                re.IGNORECASE,
            )
            if s_match:
                fields.successors = [s_match.group(1).strip()]
            else:
                s_line = re.search(r"Successor Agent\s*\(upon assumption only\):\s*([A-Za-z0-9\s\.\-]{2,40})", text, re.IGNORECASE)
                if s_line:
                    fields.successors = [s_line.group(1).strip()]

        # 5. Execution date
        d_match = re.search(r"(?:Date|dated|Dated):\s*([A-Za-z0-9\,\s\/\-]{6,25})", text)
        if d_match:
            fields.execution_date = d_match.group(1).strip()

        # 6. Effective / Springing authority
        # Only springing if authority commences ONLY upon/after incapacity
        if re.search(r"commence\s+only\s+(?:upon|after)\s+incapacity|effective\s+only\s+(?:upon|after)\s+incapacity|springing\s+upon\s+incapacity", text, re.IGNORECASE):
            fields.effective_type = "Springing upon incapacity"
        else:
            fields.effective_type = "Immediate"

        # 7. Notary block
        has_notary = bool(
            re.search(
                r"Notary\s+(?:Public|signature|seal)|acknowledgment|notarial|subscribed\s+and\s+sworn",
                text,
                re.IGNORECASE,
            )
        )
        fields.notary_block_present = has_notary
        if re.search(
            r"\[(?:STATE-COMPLIANT\s+)?NOTARIAL\s+ACKNOWLEDGMENT.*?\]|\[INSERT.*?NOTARY.*?\]",
            text,
            re.IGNORECASE,
        ) or re.search(r"Notary signature:\s*_{3,}", text):
            fields.notary_is_placeholder = True

        # 8. Witnesses
        witness_matches = re.findall(
            r"Witness\s+(?:\d+|one|two)?\s*(?:signature|name)?:?\s*([^\n\r]+)",
            text,
            re.IGNORECASE,
        )
        w_lines = len(re.findall(r"Witness\s+\d+\s+signature", text, re.IGNORECASE))
        if w_lines >= 2:
            fields.witness_count = w_lines
        elif len(witness_matches) > 0:
            fields.witness_count = min(len(witness_matches), 2)
        else:
            fields.witness_count = 0

        if re.search(r"Witness\s+\d+\s+signature:\s*_{3,}", text) or "[INSERT WITNESS" in text.upper():
            fields.witnesses_are_placeholders = True

        # 9. Agent acceptance
        has_agent_acc = bool(
            re.search(
                r"AGENT\s+ACCEPTANCE|ACCEPTANCE\s+OF\s+APPOINTMENT|AGENT['’]S\s+ACKNOWLEDGMENT",
                text,
                re.IGNORECASE,
            )
        )
        fields.agent_acceptance_present = has_agent_acc
        if re.search(
            r"\[INSERT.*?AGENT\s+ACKNOWLEDGMENT.*?\]|Agent signature:\s*_{3,}",
            text,
            re.IGNORECASE,
        ):
            fields.agent_acceptance_is_placeholder = True

        # 10. Modifications section content
        mod_match = re.search(
            r"(?:Special\s+instructions|Modifications):\s*(.*?)(?=\n[A-Z0-9\.\s]{3,}|\Z)",
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if mod_match:
            fields.modifications_content = mod_match.group(1).strip()

        # 11. Gifting authority
        if re.search(
            r"NO\s+GIFTING\s+AUTHORITY\s+IS\s+GRANTED|Agent\s+shall\s+not\s+make\s+gifts",
            text,
            re.IGNORECASE,
        ):
            fields.gifting_authority = "No gifts"
        elif re.search(r"Annual-exclusion\s+gifts\s+to\s+spouse\s+and\s+descendants", text, re.IGNORECASE):
            fields.gifting_authority = "Annual-exclusion gifts to spouse and descendants; no agent gifts"
        elif re.search(r"Annual-exclusion\s+gifts\s+to\s+descendants", text, re.IGNORECASE):
            if re.search(r"prohibit\s+agent\s+gifts", text, re.IGNORECASE):
                fields.gifting_authority = "Annual-exclusion gifts to descendants; prohibit agent gifts"
            else:
                fields.gifting_authority = "Annual-exclusion gifts to descendants; no agent gifts"
        else:
            fields.gifting_authority = "No gifts"

        # 12. Beneficiary changes
        if re.search(
            r"SPECIAL\s+BENEFICIARY\s+AUTHORITY\s+REQUESTED:\s*Yes|Beneficiary\s+changes:\s*Yes",
            text,
            re.IGNORECASE,
        ):
            fields.beneficiary_changes = True
        else:
            fields.beneficiary_changes = False

        # 13. Hot powers
        hot = []
        if re.search(r"Trust\s+creation|Create/amend\s+trusts", text, re.IGNORECASE):
            hot.append("Trust creation")
        if re.search(r"disclaimers|qualified\s+disclaimers", text, re.IGNORECASE):
            hot.append("Disclaimers")
        if re.search(r"survivorship\s+rights|joint\s+accounts", text, re.IGNORECASE):
            hot.append("Survivorship rights")
        if fields.gifting_authority != "No gifts":
            hot.append("Gifting")
        if fields.beneficiary_changes:
            hot.append("Beneficiary designations")
        fields.hot_powers = hot

        # 14. Statutory notice check
        if re.search(
            r"CAUTION\s+TO\s+THE\s+PRINCIPAL|This\s+is\s+an\s+important\s+legal\s+document",
            text,
            re.IGNORECASE,
        ) and not re.search(r"\[STATUTORY\s+CAUTION.*?INSERT.*?\]", text, re.IGNORECASE):
            fields.statutory_notices_present = True
        else:
            fields.statutory_notices_present = False

        return fields
