import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CaseKind } from "@/lib/types";
import {
  ProviderError,
  ProviderTimeoutError,
  RateLimitedError,
  ServiceUnavailableError,
} from "@/lib/errors";
import { aiModelName, maxTokens } from "@/lib/config";
import { sampleAudit, sampleJurisdiction, sampleRejection } from "@/lib/ai/samples";
import { callPoaEngine, isPoaEngineConfigured } from "@/lib/ai/poa-engine-client";

export interface PreparedDocument {
  name: string;
  mimeType: string;
  base64: string;
  buffer?: Buffer;
}

export interface ProviderCallInput {
  mode: CaseKind;
  prompt: string;
  poa: PreparedDocument;
  rejection?: PreparedDocument | null;
  bank?: string;
  customRules?: string;
  signal?: AbortSignal;
}

export interface ProviderCallResult {
  rawText: string;
  provider: "anthropic" | "google" | "poa-engine" | "mock";
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
}

export interface AIProvider {
  name: "anthropic" | "google" | "poa-engine" | "mock";
  complete(input: ProviderCallInput): Promise<ProviderCallResult>;
}

// ---------------------------------------------------------------------------
// 1. Anthropic Claude Adapter
// ---------------------------------------------------------------------------

export class AnthropicAdapter implements AIProvider {
  public readonly name = "anthropic";

  async complete(input: ProviderCallInput): Promise<ProviderCallResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableError("Anthropic API key is not configured.");
    }

    const model = aiModelName();
    const client = new Anthropic({ apiKey, timeout: 45_000 });
    const startTime = Date.now();

    const blocks: Anthropic.ContentBlockParam[] = [];

    // POA document block
    if (input.poa.mimeType === "application/pdf") {
      blocks.push({
        type: "document",
        title: input.poa.name,
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: input.poa.base64,
        },
      });
    } else {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.poa.mimeType as "image/png" | "image/jpeg" | "image/webp",
          data: input.poa.base64,
        },
      });
    }

    // Rejection letter block if provided
    if (input.rejection) {
      if (input.rejection.mimeType === "application/pdf") {
        blocks.push({
          type: "document",
          title: input.rejection.name,
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: input.rejection.base64,
          },
        });
      } else {
        blocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: input.rejection.mimeType as "image/png" | "image/jpeg" | "image/webp",
            data: input.rejection.base64,
          },
        });
      }
    }

    // Main prompt
    blocks.push({ type: "text", text: input.prompt });

    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
      attempts++;
      try {
        const response = await client.messages.create(
          {
            model,
            max_tokens: maxTokens(),
            system:
              "You review powers of attorney for ConcretePOA. Return strictly a single JSON object conforming to the requested schema. No conversational prose, markdown tags, or disclaimers. This is an informational compliance aid, not legal advice.",
            messages: [{ role: "user", content: blocks }],
          },
          { signal: input.signal }
        );

        const latencyMs = Date.now() - startTime;
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");

        return {
          rawText: text,
          provider: "anthropic",
          model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          latencyMs,
        };
      } catch (err: unknown) {
        const error = err as { status?: number; name?: string; message?: string };
        const status = error.status;

        // Handle Rate limits
        if (status === 429) {
          if (attempts <= maxRetries) {
            await new Promise((res) => setTimeout(res, 1000 * attempts));
            continue;
          }
          throw new RateLimitedError(60, "Anthropic API rate limit exceeded.");
        }

        // Handle Timeouts
        if (error.name === "AbortError" || error.name === "APIConnectionTimeoutError") {
          throw new ProviderTimeoutError("Analysis request timed out after 45 seconds.");
        }

        // Handle 5xx server errors with backoff
        if (status && status >= 500 && attempts <= maxRetries) {
          await new Promise((res) => setTimeout(res, 1000 * attempts));
          continue;
        }

        throw new ProviderError(
          error.message || "Anthropic service encountered an error processing the document."
        );
      }
    }

    throw new ProviderError("Anthropic service failed after retries.");
  }
}

// ---------------------------------------------------------------------------
// 2. Google Gemini Adapter
// ---------------------------------------------------------------------------

export class GoogleAdapter implements AIProvider {
  public readonly name = "google";

  async complete(input: ProviderCallInput): Promise<ProviderCallResult> {
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableError("Google Gemini API key is not configured.");
    }

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const startTime = Date.now();

    const parts: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }> = [];

    // POA document part
    parts.push({
      inlineData: {
        mimeType: input.poa.mimeType,
        data: input.poa.base64,
      },
    });

    // Rejection document part if provided
    if (input.rejection) {
      parts.push({
        inlineData: {
          mimeType: input.rejection.mimeType,
          data: input.rejection.base64,
        },
      });
    }

    // Text prompt
    parts.push({ text: input.prompt });

    const requestBody = {
      systemInstruction: {
        parts: [
          {
            text: "You review powers of attorney for ConcretePOA. Return strictly a single JSON object matching the requested schema. No prose or markdown wrappers.",
          },
        ],
      },
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: maxTokens(),
      },
    };

    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 45_000);
      if (input.signal) {
        input.signal.addEventListener("abort", () => abortCtrl.abort());
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortCtrl.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        throw new RateLimitedError(60, "Google Gemini rate limit exceeded.");
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new ProviderError(`Google Gemini returned status ${res.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("\n") || "";

      const inputTokens = data.usageMetadata?.promptTokenCount;
      const outputTokens = data.usageMetadata?.candidatesTokenCount;
      const latencyMs = Date.now() - startTime;

      return {
        rawText: text,
        provider: "google",
        model,
        inputTokens,
        outputTokens,
        latencyMs,
      };
    } catch (err: unknown) {
      if (err instanceof RateLimitedError || err instanceof ProviderError) throw err;
      const error = err as { name?: string; message?: string };
      if (error.name === "AbortError") {
        throw new ProviderTimeoutError("Google Gemini request timed out after 45 seconds.");
      }
      throw new ProviderError(error.message || "Failed to complete request with Google Gemini.");
    }
  }
}

// ---------------------------------------------------------------------------
// 3. POA Engine (Cloud Run) Adapter
// ---------------------------------------------------------------------------

export class PoaEngineAdapter implements AIProvider {
  public readonly name = "poa-engine";

  async complete(input: ProviderCallInput): Promise<ProviderCallResult> {
    const startTime = Date.now();
    const poaFile = new File(
      [input.poa.buffer || Buffer.from(input.poa.base64, "base64")],
      input.poa.name,
      { type: input.poa.mimeType }
    );

    let rejectionFile: File | null = null;
    if (input.rejection) {
      rejectionFile = new File(
        [input.rejection.buffer || Buffer.from(input.rejection.base64, "base64")],
        input.rejection.name,
        { type: input.rejection.mimeType }
      );
    }

    const result = await callPoaEngine({
      poa: poaFile,
      mode: input.mode,
      bank: input.bank,
      rejection: rejectionFile,
      customRules: input.customRules,
    });

    if (!result) {
      throw new ProviderError("POA Engine returned an empty or unparseable response.");
    }

    const latencyMs = Date.now() - startTime;
    return {
      rawText: JSON.stringify(result),
      provider: "poa-engine",
      model: "poa-deterministic-v1",
      latencyMs,
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Mock Provider (Zero cost, deterministic tests & evals)
// ---------------------------------------------------------------------------

export class MockProvider implements AIProvider {
  public readonly name = "mock";

  async complete(input: ProviderCallInput): Promise<ProviderCallResult> {
    let sampleData: unknown;

    if (input.mode === "audit") {
      sampleData = sampleAudit(input.bank || "Other");
    } else if (input.mode === "diagnosis") {
      sampleData = sampleRejection();
    } else {
      sampleData = sampleJurisdiction();
    }

    return {
      rawText: JSON.stringify(sampleData),
      provider: "mock",
      model: "mock-provider-v1",
      inputTokens: 500,
      outputTokens: 500,
      latencyMs: 15,
    };
  }
}

// ---------------------------------------------------------------------------
// Provider Factory & Resolution
// ---------------------------------------------------------------------------

export function getProvider(override?: string): AIProvider {
  const configuredProvider = override || process.env.AI_PROVIDER?.trim()?.toLowerCase();

  if (configuredProvider === "mock") {
    return new MockProvider();
  }

  if (configuredProvider === "google") {
    return new GoogleAdapter();
  }

  if (configuredProvider === "anthropic") {
    return new AnthropicAdapter();
  }

  if (configuredProvider === "poa-engine") {
    return new PoaEngineAdapter();
  }

  // Auto-detection based on configured credentials
  if (isPoaEngineConfigured()) {
    return new PoaEngineAdapter();
  }

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return new AnthropicAdapter();
  }

  if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  ) {
    return new GoogleAdapter();
  }

  // In test / development without credentials, provide MockProvider
  if (process.env.NODE_ENV !== "production") {
    return new MockProvider();
  }

  throw new ServiceUnavailableError("No AI provider credentials or POA Engine configured.");
}
