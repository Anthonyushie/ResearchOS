import type { NextRequest } from 'next/server';
import { upsertRecord, isDbConfigured } from '@/lib/db';
import { requireOwnerId } from '@/lib/auth-helpers';
import { analyzeResearchText, isGeminiConfigured, MIN_TEXT_CHARS } from '@/lib/gemini';
import type { ResearchRecord } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024;
// Gemini inline file uploads cap at ~20MB; larger PDFs use extracted text only.
const MAX_INLINE_BYTES = 20 * 1024 * 1024;

interface SourceExtraction {
  text: string;
  pages?: number;
  /** Real document metadata from the PDF itself (never invented). */
  docTitle: string;
  docAuthor: string;
  pdfBase64?: string;
}

async function extractSource(file: File): Promise<SourceExtraction> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  const empty: SourceExtraction = { text: '', docTitle: '', docAuthor: '' };

  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) {
    return { ...empty, text: buf.toString('utf-8').slice(0, 20000) };
  }

  if (name.endsWith('.csv') || file.type === 'text/csv') {
    // Tables: send header + first rows + row count, not a raw 20k dump.
    const raw = buf.toString('utf-8');
    const lines = raw.split(/\r?\n/);
    const preview = lines.slice(0, 31).join('\n').slice(0, 12000);
    const dataRows = Math.max(0, lines.filter((l) => l.trim()).length - 1);
    return {
      ...empty,
      text: `CSV with ${dataRows} data rows.\n${preview}`,
    };
  }

  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    let parser: {
      getText: () => Promise<{ text?: string; total?: number }>;
      getInfo?: () => Promise<{ info?: { Title?: string; Author?: string } }>;
      destroy: () => Promise<void>;
    } | null = null;
    try {
      const { PDFParse } = (await import('pdf-parse')) as unknown as {
        PDFParse: new (opts: { data: Buffer }) => NonNullable<typeof parser>;
      };
      parser = new PDFParse({ data: buf });
      // Sequential: getText and getInfo share one pdf.js document and must
      // not run concurrently.
      const textRes = await parser.getText();
      let infoRes: { info?: { Title?: string; Author?: string } } | null = null;
      try {
        infoRes = (await parser.getInfo?.()) ?? null;
      } catch (infoErr) {
        console.error('[upload] pdf getInfo failed (non-fatal):', infoErr);
      }
      const text = (textRes.text ?? '').slice(0, 20000);
      const pages = typeof textRes.total === 'number' ? textRes.total : undefined;
      console.log(
        `[upload] pdf parsed ${file.name}: ${text.length} chars${pages !== undefined ? `, ${pages} pages` : ''}`
      );
      return {
        text,
        pages,
        docTitle: String(infoRes?.info?.Title ?? '').trim(),
        docAuthor: String(infoRes?.info?.Author ?? '').trim(),
        // Send the native PDF only when extraction is thin. Sending both a
        // text-rich PDF and its extracted text adds latency and failure risk.
        pdfBase64:
          text.trim().length < MIN_TEXT_CHARS && buf.length <= MAX_INLINE_BYTES
            ? buf.toString('base64')
            : undefined,
      };
    } catch (err) {
      console.error('[upload] pdf-parse failed:', err);
      return {
        ...empty,
        pdfBase64: buf.length <= MAX_INLINE_BYTES ? buf.toString('base64') : undefined,
      };
    } finally {
      try {
        await parser?.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
  }

  // images / others: no server-side text extraction yet
  return empty;
}

export async function POST(request: NextRequest) {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'Multipart field "file" is required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'File exceeds 50 MB limit' }, { status: 413 });
    }

    const source = await extractSource(file);
    const extractedText = source.text;
    // Client may send edited metadata; otherwise run Gemini analysis
    const metadataRaw = form.get('metadata');
    let analysis;
    let aiUsed = false;
    let aiModel = '';
    let aiStatus: ResearchRecord['aiStatus'] = 'failed';

    if (typeof metadataRaw === 'string' && metadataRaw) {
      try {
        analysis = JSON.parse(metadataRaw) as Awaited<ReturnType<typeof analyzeResearchText>>['analysis'];
        aiStatus = 'indexed';
      } catch {
        const r = await analyzeResearchText(file.name, extractedText, {
          pdfBase64: source.pdfBase64,
        });
        analysis = r.analysis;
        aiUsed = r.aiUsed;
        aiModel = r.model;
        aiStatus = r.status;
      }
    } else {
      const r = await analyzeResearchText(file.name, extractedText, {
        pdfBase64: source.pdfBase64,
      });
      analysis = r.analysis;
      aiUsed = r.aiUsed;
      aiModel = r.model;
      aiStatus = r.status;
    }

    // Prefer real PDF-embedded metadata over invented values — but only to
    // FILL blanks, never to overwrite model output.
    if (source.docTitle && !analysis.title) analysis.title = source.docTitle;
    if (source.docAuthor && analysis.authors.length === 0) {
      analysis.authors = [source.docAuthor];
    }

    const aiProcessed = aiUsed && aiStatus === 'indexed';
    const record: ResearchRecord = {
      id: `res-${Date.now().toString(36)}`,
      title: analysis.title,
      type: analysis.type,
      authors: analysis.authors,
      date: analysis.date,
      topics: analysis.topics,
      keywords: analysis.keywords,
      variables: analysis.variables,
      experimentName: analysis.experimentName,
      description: analysis.description,
      extractedText: extractedText || `No readable text extracted from ${file.name}.`,
      summary: analysis.summary,
      findings: analysis.findings,
      limitations: analysis.limitations,
      fileName: file.name,
      aiProcessed,
      ownerId: authz.ownerId,
      aiStatus,
      aiModel,
      extractionChars: extractedText.length,
      extractionPages: source.pages,
    };

    if (!isDbConfigured()) {
      return Response.json(
        {
          record,
          aiUsed,
          aiStatus,
          extraction: { chars: extractedText.length, pages: source.pages ?? null },
          source: 'mock',
          warning: 'DATABASE_URL not configured — not persisted',
        },
        { status: 201 }
      );
    }

    const saved = await upsertRecord(record, authz.ownerId);
    return Response.json(
      {
        record: saved,
        aiUsed,
        aiStatus,
        geminiConfigured: isGeminiConfigured(),
        extraction: { chars: extractedText.length, pages: source.pages ?? null },
        minChars: MIN_TEXT_CHARS,
        source: 'db',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[api/upload] failed:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
