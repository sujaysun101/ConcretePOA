import mammoth from 'mammoth';

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const ACCEPTED_UPLOAD_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  [DOCX_MIME]: ['.docx'],
} as const;

export const ACCEPTED_UPLOAD_LABEL = 'PDF, DOCX, PNG, or JPG (Max 10MB)';

export const ACCEPTED_INPUT_ATTR = '.pdf,.docx,image/png,image/jpeg,.jpg,.jpeg';

export type PreparedDocument =
  | { kind: 'media'; dataUrl: string; mimeType: string; fileName: string }
  | { kind: 'text'; text: string; mimeType: typeof DOCX_MIME; fileName: string };

export function isDocxFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === DOCX_MIME ||
    name.endsWith('.docx') ||
    // Some browsers leave type empty for docx downloads
    (file.type === '' && name.endsWith('.docx')) ||
    file.type === 'application/octet-stream' && name.endsWith('.docx')
  );
}

export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value?.trim() ?? '';
  if (!text) {
    throw new Error(
      'Could not extract text from this DOCX. The file may be empty or image-only.'
    );
  }
  return text;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Normalize any accepted upload into a Gemini-ready payload. */
export async function prepareDocument(file: File): Promise<PreparedDocument> {
  if (isDocxFile(file)) {
    const text = await extractDocxText(file);
    return {
      kind: 'text',
      text,
      mimeType: DOCX_MIME,
      fileName: file.name,
    };
  }

  const mimeType = file.type || 'application/octet-stream';
  if (
    !mimeType.startsWith('image/') &&
    mimeType !== 'application/pdf'
  ) {
    throw new Error(
      `Unsupported file type "${mimeType || file.name}". Use PDF, DOCX, PNG, or JPG.`
    );
  }

  const dataUrl = await readAsDataUrl(file);
  return {
    kind: 'media',
    dataUrl,
    mimeType,
    fileName: file.name,
  };
}

/** Build Gemini content parts for a prepared document (after the prompt text part). */
export function documentToGeminiParts(doc: PreparedDocument): Array<
  { text: string } | { inlineData: { data: string; mimeType: string } }
> {
  if (doc.kind === 'text') {
    return [
      {
        text: `DOCUMENT FILE: ${doc.fileName} (DOCX — extracted text follows)\n\n--- BEGIN DOCUMENT TEXT ---\n${doc.text}\n--- END DOCUMENT TEXT ---`,
      },
    ];
  }

  return [
    {
      inlineData: {
        data: doc.dataUrl.split(',')[1] || doc.dataUrl,
        mimeType: doc.mimeType,
      },
    },
  ];
}
