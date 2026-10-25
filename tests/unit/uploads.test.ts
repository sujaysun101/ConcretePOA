import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  detectMimeFromBytes,
  sanitizeFilename,
  validateUploadedFile,
  MAX_UPLOAD_BYTES,
  MAX_PDF_PAGES,
} from "@/lib/uploads";

describe("Upload Hardening (lib/uploads.ts)", () => {
  it("sanitizes filenames preventing path traversal and control characters", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\secret\\document.pdf")).toBe("document.pdf");
    expect(sanitizeFilename("my\x00file\x1fname.pdf")).toBe("myfilename.pdf");
    expect(sanitizeFilename("")).toBe("document");
  });

  it("detects MIME types from magic bytes correctly", () => {
    const pdfBytes = Buffer.from("%PDF-1.4\n%...");
    expect(detectMimeFromBytes(pdfBytes)).toBe("application/pdf");

    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(detectMimeFromBytes(pngBytes)).toBe("image/png");

    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectMimeFromBytes(jpegBytes)).toBe("image/jpeg");

    const webpBytes = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    expect(detectMimeFromBytes(webpBytes)).toBe("image/webp");

    const fakeBytes = Buffer.from("<html><script>alert(1)</script></html>");
    expect(detectMimeFromBytes(fakeBytes)).toBeNull();
  });

  it("accepts a valid small PDF", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const pdfBytes = await doc.save();

    const file = new File([pdfBytes], "test-poa.pdf", { type: "application/pdf" });
    const validated = await validateUploadedFile(file);

    expect(validated.name).toBe("test-poa.pdf");
    expect(validated.mimeType).toBe("application/pdf");
    expect(validated.pageCount).toBe(1);
    expect(validated.base64).toBeDefined();
  });

  it("rejects an oversized file (> 4 MB)", async () => {
    const bigBlob = new Uint8Array(MAX_UPLOAD_BYTES + 1024);
    const file = new File([bigBlob], "oversized.pdf", { type: "application/pdf" });

    await expect(validateUploadedFile(file)).rejects.toThrow(/limit is 4 MB/i);
  });

  it("rejects non-allowlisted mime / fake PDF disguised by extension", async () => {
    const fakeContent = new TextEncoder().encode("Not a real PDF file");
    const file = new File([fakeContent], "fake.pdf", { type: "application/pdf" });

    await expect(validateUploadedFile(file)).rejects.toThrow(/valid PDF, PNG, JPEG, or WebP/i);
  });

  it("rejects PDF exceeding maximum page count", async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < MAX_PDF_PAGES + 2; i++) {
      doc.addPage([100, 100]);
    }
    const pdfBytes = await doc.save();

    const file = new File([pdfBytes], "large-poa.pdf", { type: "application/pdf" });
    await expect(validateUploadedFile(file)).rejects.toThrow(/limit is 40 pages/i);
  });
});
