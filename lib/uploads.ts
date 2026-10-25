import "server-only";
import { PDFDocument } from "pdf-lib";
import {
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  BadRequestError,
} from "@/lib/errors";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB limit
export const MAX_PDF_PAGES = 40;

export type SupportedMime = "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

export interface ValidatedFile {
  name: string;
  mimeType: SupportedMime;
  buffer: Buffer;
  base64: string;
  pageCount?: number;
}

/**
 * Sanitizes a filename to prevent path traversal and control character issues.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "document";
  // Remove path traversal and directory separators
  let clean = filename.replace(/^.*[\\/]/, "");
  // Remove non-printable or control characters
  clean = clean.replace(/[\x00-\x1f\x7f-\x9f]/g, "");
  // Strip null bytes
  clean = clean.replace(/\0/g, "");
  // Limit length
  if (clean.length > 120) {
    const extMatch = clean.match(/(\.[a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : "";
    clean = clean.slice(0, 120 - ext.length) + ext;
  }
  return clean || "document";
}

/**
 * Detects MIME type from magic bytes in the buffer.
 */
export function detectMimeFromBytes(buffer: Buffer): SupportedMime | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // PNG: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: 0xFF, 0xD8, 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // WebP: RIFF at 0..3 and WEBP at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  return null;
}

export function normalizeMime(type: string): SupportedMime | null {
  const value = type === "image/jpg" ? "image/jpeg" : type;
  if (
    value === "application/pdf" ||
    value === "image/png" ||
    value === "image/jpeg" ||
    value === "image/webp"
  ) {
    return value;
  }
  return null;
}

/**
 * Validates, checks magic bytes, inspects encrypted status and page count for an uploaded file.
 */
export async function validateUploadedFile(file: File, label = "The uploaded file"): Promise<ValidatedFile> {
  if (!file || file.size <= 0) {
    throw new BadRequestError(`${label} is empty.`);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PayloadTooLargeError(`${label} is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 4 MB.`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const cleanName = sanitizeFilename(file.name);

  const detectedMime = detectMimeFromBytes(buffer);
  if (!detectedMime) {
    throw new UnsupportedMediaTypeError(
      `${label} must be a valid PDF, PNG, JPEG, or WebP document.`,
      "unsupported_file"
    );
  }

  if (detectedMime === "application/pdf") {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
      if (pdfDoc.isEncrypted) {
        throw new UnsupportedMediaTypeError(
          "This PDF is password-protected. Remove the password and upload it again.",
          "encrypted_pdf"
        );
      }

      const pageCount = pdfDoc.getPageCount();
      if (pageCount > MAX_PDF_PAGES) {
        throw new UnsupportedMediaTypeError(
          `The PDF has ${pageCount} pages. The limit is ${MAX_PDF_PAGES} pages.`,
          "too_many_pages"
        );
      }

      return {
        name: cleanName,
        mimeType: "application/pdf",
        buffer,
        base64: buffer.toString("base64"),
        pageCount,
      };
    } catch (err) {
      if (err instanceof UnsupportedMediaTypeError) {
        throw err;
      }
      const errStr = String(err).toLowerCase();
      if (errStr.includes("encrypt") || errStr.includes("password")) {
        throw new UnsupportedMediaTypeError(
          "This PDF is password-protected. Remove the password and upload it again.",
          "encrypted_pdf"
        );
      }
      throw new UnsupportedMediaTypeError(
        "Could not parse the PDF document. Please verify the file is not corrupted.",
        "unsupported_file"
      );
    }
  }

  return {
    name: cleanName,
    mimeType: detectedMime,
    buffer,
    base64: buffer.toString("base64"),
  };
}
