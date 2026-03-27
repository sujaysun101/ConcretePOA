import { GoogleGenAI, Type } from "@google/genai";
import {
  auditKnowledgePreamble,
  jurisdictionKnowledgePreamble,
  rejectionKnowledgePreamble,
} from "../data/knowledgeContext";
import { AuditResult, Bank, RejectionDiagnosis, JurisdictionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function trackJurisdictionalLaw(
  fileBase64: string,
  mimeType: string
): Promise<JurisdictionResult> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    ${jurisdictionKnowledgePreamble()}

    You are a "Jurisdictional Law Tracker" for "ConcretePOA".
    Your task is to compare the provided Power of Attorney (POA) against the CURRENT 2026 statutory requirements for the state listed in the document.

    FOCUS AREAS:
    1. "Caution to the Principal" Section:
       - Is it verbatim as required by the latest 2026 state law?
       - Identify any "Statutory Drift" (e.g., outdated warnings, missing mandatory language).
    2. "Agent's Signature" Page:
       - Does the document include the mandatory "Agent's Signature" or "Agent's Acceptance" page if required by that specific state in 2026?
    3. Statutory Drift:
       - List any specific areas where the document has become legally obsolete due to new legislation passed between the document's execution date and March 2026.

    OUTPUT:
    Return the analysis in JSON format matching the JurisdictionResult interface.
    Include a 'statutoryYear' of 2026.
    'overallComplianceScore' should be 0-100 based on how well it matches 2026 mandates.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: fileBase64.split(',')[1] || fileBase64,
              mimeType: mimeType
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          timestamp: { type: Type.NUMBER },
          state: { type: Type.STRING },
          statutoryYear: { type: Type.NUMBER },
          cautionSectionVerbatim: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["compliant", "non-compliant", "missing"] },
              requiredText: { type: Type.STRING },
              actualText: { type: Type.STRING },
              driftDetails: { type: Type.STRING }
            },
            required: ["status", "requiredText", "driftDetails"]
          },
          agentSignaturePage: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["compliant", "non-compliant", "missing"] },
              requirements: { type: Type.STRING },
              driftDetails: { type: Type.STRING }
            },
            required: ["status", "requirements", "driftDetails"]
          },
          statutoryDrift: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ["high", "medium", "low"] },
                remediation: { type: Type.STRING }
              },
              required: ["title", "description", "severity", "remediation"]
            }
          },
          overallComplianceScore: { type: Type.NUMBER }
        },
        required: ["id", "timestamp", "state", "statutoryYear", "cautionSectionVerbatim", "agentSignaturePage", "statutoryDrift", "overallComplianceScore"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  if (!result.id) result.id = Math.random().toString(36).substr(2, 9);
  if (!result.timestamp) result.timestamp = Date.now();
  
  return result;
}

export async function auditPOA(
  fileBase64: string, 
  mimeType: string, 
  targetBank: Bank, 
  customRules?: string
): Promise<AuditResult> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    You are a Senior Banking Compliance Auditor & Elder Law Technical Specialist for "ConcretePOA".
    Analyze the provided Power of Attorney (POA) document against the requirements for ${targetBank}.
    
    ${customRules ? `ADDITIONAL CUSTOM RULES TO AUDIT AGAINST: "${customRules}"` : ''}

    OPERATIONAL PROTOCOLS:
    1. Document Deconstruction (OCR-to-Logic):
       - Extract the full raw text of the document.
       - Identify Principal, Agent, State of Execution, and Execution Date.
       - Jurisdictional Nexus: Which state's law governs?
       - Execution Date: Is it stale (>5-10 years)?
       - Authority Granularity: Does it grant "Super Powers" (changing beneficiaries, gifting, creating trusts)?
       - Notary Integrity: Does the notary block match statutory language?
    
    2. Institutional Matching (${targetBank}):
       - Fidelity/Schwab: Specific "Indemnification of Agent" clauses.
       - Chase/BofA: "Durability Clause" required.
       - Vanguard: Proprietary forms often needed.
       - General: Highest common denominator of strictness if specific rule unknown.
    
    3. Risk Assessment:
       - High (85-100%): Meets state law and known internal bank policies.
       - Medium (50-85%): Legally valid but missing "preferred" institutional language.
       - Low (<50%): Missing mandatory clauses or improper execution.

    4. Remediation:
       - Provide a legally-sound "Affidavit of Full Force and Effect" or "Amendment" template tailored to the friction points.

    Return the analysis in JSON format matching the AuditResult interface.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: fileBase64.split(',')[1] || fileBase64,
              mimeType: mimeType
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          timestamp: { type: Type.NUMBER },
          bankTarget: { type: Type.STRING },
          acceptanceProbability: { type: Type.NUMBER },
          primaryRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          clauseAudit: { type: Type.ARRAY, items: { type: Type.STRING } },
          executionAudit: { type: Type.ARRAY, items: { type: Type.STRING } },
          remediationBlueprint: {
            type: Type.OBJECT,
            properties: {
              action1: { type: Type.STRING },
              action2: { type: Type.STRING },
              concreteFix: { type: Type.STRING },
              affidavitTemplate: { type: Type.STRING }
            },
            required: ["action1", "action2", "concreteFix", "affidavitTemplate"]
          },
          extractedData: {
            type: Type.OBJECT,
            properties: {
              principal: { type: Type.STRING },
              agent: { type: Type.STRING },
              state: { type: Type.STRING },
              date: { type: Type.STRING },
              rawText: { type: Type.STRING }
            },
            required: ["principal", "agent", "state", "date"]
          }
        },
        required: ["id", "timestamp", "bankTarget", "acceptanceProbability", "primaryRedFlags", "clauseAudit", "executionAudit", "remediationBlueprint", "extractedData"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  if (!result.id) result.id = Math.random().toString(36).substr(2, 9);
  if (!result.timestamp) result.timestamp = Date.now();
  
  return result;
}

export async function diagnoseRejection(
  poaBase64: string,
  poaMimeType: string,
  rejectionBase64: string,
  rejectionMimeType: string
): Promise<RejectionDiagnosis> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    ${rejectionKnowledgePreamble()}

    You are a "Rejection Diagnostic Engine" for "ConcretePOA".
    
    INPUTS:
    1. A PDF/Image of a Rejected Power of Attorney (POA).
    2. A PDF/Image of the Bank's Rejection Letter.

    LOGIC:
    1. Analyze the Rejection Letter for keywords like "Indemnification," "Stale," "Third Party Form," "Statutory Gift," "Super Powers," etc.
    2. Locate the corresponding section in the POA that the bank is referencing.
    3. Compare the two. If the bank says "Missing Gifting Power," but the POA has a "General Power" section, explain to the user that "General" is not "Specific" enough for this bank's internal policy.
    4. Provide a "Translation" of the bank's legalese into a 3-step action plan for the caregiver.

    OUTPUT:
    Return the analysis in JSON format matching the RejectionDiagnosis interface.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: poaBase64.split(',')[1] || poaBase64,
              mimeType: poaMimeType
            }
          },
          {
            inlineData: {
              data: rejectionBase64.split(',')[1] || rejectionBase64,
              mimeType: rejectionMimeType
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          timestamp: { type: Type.NUMBER },
          bankName: { type: Type.STRING },
          rejectionReason: { type: Type.STRING },
          legaleseTranslation: { type: Type.STRING },
          poaConflictSection: { type: Type.STRING },
          actionPlan: {
            type: Type.OBJECT,
            properties: {
              step1: { type: Type.STRING },
              step2: { type: Type.STRING },
              step3: { type: Type.STRING }
            },
            required: ["step1", "step2", "step3"]
          },
          remediationText: { type: Type.STRING }
        },
        required: ["id", "timestamp", "bankName", "rejectionReason", "legaleseTranslation", "poaConflictSection", "actionPlan", "remediationText"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  if (!result.id) result.id = Math.random().toString(36).substr(2, 9);
  if (!result.timestamp) result.timestamp = Date.now();
  
  return result;
}
