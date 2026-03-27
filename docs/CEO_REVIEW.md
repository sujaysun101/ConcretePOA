# CEO review — ConcretePOA (condensed)

**Mode:** SELECTIVE EXPANSION baseline with HOLD on legal claims  
**Date:** 2026-03-27  
**Scope:** Product is a client-side Gemini app for POA review assistance (not a law firm).

## Premise

**Problem:** Caregivers and principals need faster feedback on whether a POA is likely to pass institutional checks.  
**Outcome:** Reduce rework cycles with broker-dealers and banks by surfacing clause gaps, staleness, and rejection-letter translation.  
**Non-goals:** Guaranteed acceptance, filing estate plans, or substituting for counsel.

## Strategic recommendations

1. **Knowledge, not “training”** — You cannot fine-tune Google’s consumer Gemini API from this stack the way you train a local model. The correct lever is **retrieval + rubric injection + evals** (now partially implemented via `src/data/` and prompts).
2. **Server boundary for production** — API keys in the browser are acceptable for demos only. For real users, move Gemini calls to a **backend** with secrets, rate limits, and abuse controls.
3. **Evaluation dataset** — Maintain a private JSONL of (redacted POA snippet, bank, expected severity) for regression testing prompts; never commit real PII.
4. **Disclaimers** — Keep prominent UI copy that output is informational and jurisdiction-specific law must be verified by counsel.

## Risk register (short)

| Risk                         | Mitigation                                      |
|-----------------------------|-------------------------------------------------|
| Hallucinated statutory text | Prompt asks to quote document; add RAG from primary sources later |
| Key exfiltration from client | Move to server-side API                         |
| Over-confidence scores      | Calibrate prompts + show confidence bands       |

## NOT in scope (this iteration)

- Fine-tuning proprietary models
- Scraping paywalled legal databases
- Storing user documents server-side without a compliance review

## Next reviews suggested

- **Engineering:** `/plan-eng-review` for API boundary, tests, and error paths  
- **Design:** `/plan-design-review` if expanding workflows or trust copy  

---

*This is a shortened CEO-style review aligned with gstack `plan-ceo-review` themes; it is not a substitute for legal or compliance sign-off.*
