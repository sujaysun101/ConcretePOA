import "server-only";
import { GoogleAuth } from "google-auth-library";
import { logger } from "@/lib/log";

export function isPoaEngineConfigured(): boolean {
  return Boolean(process.env.POA_ENGINE_URL?.trim());
}

export async function callPoaEngine(params: {
  poa: File;
  mode: string;
  bank?: string;
  rejection?: File | null;
  customRules?: string;
}): Promise<unknown | null> {
  const targetUrl = process.env.POA_ENGINE_URL?.trim();
  if (!targetUrl) return null;

  try {
    const analyzeEndpoint = `${targetUrl.replace(/\/+$/, "")}/analyze`;
    const form = new FormData();
    form.append("poa", params.poa);
    form.append("mode", params.mode);
    if (params.bank) form.append("bank", params.bank);
    if (params.rejection) form.append("rejection", params.rejection);
    if (params.customRules) form.append("customRules", params.customRules);

    const authHeaders: Record<string, string> = {};

    const saKeyB64 = process.env.GCP_SA_KEY_B64?.trim();
    if (saKeyB64) {
      try {
        const credentialsJson = Buffer.from(saKeyB64, "base64").toString("utf-8");
        const credentials = JSON.parse(credentialsJson);
        const auth = new GoogleAuth({ credentials });
        const client = await auth.getIdTokenClient(targetUrl);
        const idTokenHeaders = await client.getRequestHeaders(analyzeEndpoint);
        if (idTokenHeaders && typeof idTokenHeaders === "object") {
          for (const [key, value] of Object.entries(idTokenHeaders)) {
            if (typeof value === "string") {
              authHeaders[key] = value;
            }
          }
        }
      } catch (authErr) {
        logger.warn({
          event: "poa_engine_auth_error",
          error: authErr instanceof Error ? authErr.message : "ID token signing failed",
        });
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000); // 60s timeout

    const res = await fetch(analyzeEndpoint, {
      method: "POST",
      body: form,
      headers: authHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.warn({
        event: "poa_engine_http_error",
        error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
      });
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    logger.warn({
      event: "poa_engine_call_failed",
      error: err instanceof Error ? err.message : "Network/timeout error",
    });
    return null;
  }
}
