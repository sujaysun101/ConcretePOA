import "server-only";

/**
 * Sanitizes user-provided custom rules to prevent prompt injection, XML breakout,
 * and context exhaustion.
 * - Caps at 2,000 characters
 * - Caps at 25 rules (lines)
 * - Strips ASCII control characters (keeping \n, \r, \t)
 * - Strips tag breakouts
 * - Wraps safely in <user_rules>
 */
export function sanitizeUserRules(input?: string | null): string | undefined {
  if (!input || typeof input !== "string") return undefined;

  // 1. Strip ASCII control characters except \r, \n, \t
  let clean = input.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim();
  if (!clean) return undefined;

  // 2. Prevent closing XML breakout tags
  clean = clean.replace(/<\/?user_rules>/gi, "");

  // 3. Truncate to maximum 2,000 characters
  if (clean.length > 2000) {
    clean = clean.slice(0, 2000);
  }

  // 4. Cap at maximum 25 rules (non-empty lines)
  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return undefined;

  const cappedLines = lines.slice(0, 25);
  clean = cappedLines.join("\n");

  return `<user_rules>\n${clean}\n</user_rules>`;
}

/**
 * Sanitizes text evidence quotes to max 300 chars without line-break pollution.
 */
export function sanitizeEvidenceQuote(quote?: string | null, max = 300): string {
  if (!quote) return "";
  const cleaned = quote.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max - 3) + "...";
}
