export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const ACCEPTED = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export function normalizeMime(type: string): "application/pdf" | "image/png" | "image/jpeg" | "image/webp" | null {
  const value = type === "image/jpg" ? "image/jpeg" : type;
  if (ACCEPTED.has(value)) return value as "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  return null;
}
