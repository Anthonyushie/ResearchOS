import type { NextRequest } from 'next/server';
import { upsertRecord, isDbConfigured } from '@/lib/db';
import { analyzeResearchText } from '@/lib/gemini';
import type { ResearchRecord } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 50 * 1024 * 1024;

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv') || file.type.startsWith('text/')) {
    return buf.toString('utf-8').slice(0, 20000);
  }
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const mod: unknown = await import('pdf-parse');
      const fn =
        typeof mod === 'function'
          ? (mod as (b: Buffer) => Promise<{ text?: string }>)
          : (mod as { default?: (b: Buffer) => Promise<{ text?: string }> }).default;
      if (!fn) return '';
      const parsed = await fn(buf);
      return (parsed.text ?? '').slice(0, 20000);
    } catch (err) {
      console.error('[upload] pdf-parse failed:', err);
      return '';
    }
  }
  // images / others: no server-side text extraction yet
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'Multipart field "file" is required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'File exceeds 50 MB limit' }, { status: 413 });
    }

    const extractedText = await extractText(file);
    // Client may send edited metadata; otherwise run Gemini analysis
    const metadataRaw = form.get('metadata');
    let analysis;
    let aiUsed = false;

    if (typeof metadataRaw === 'string' && metadataRaw) {
      try {
        analysis = JSON.parse(metadataRaw) as Awaited<ReturnType<typeof analyzeResearchText>>['analysis'];
      } catch {
        const r = await analyzeResearchText(file.name, extractedText);
        analysis = r.analysis;
        aiUsed = r.aiUsed;
      }
    } else {
      const r = await analyzeResearchText(file.name, extractedText);
      analysis = r.analysis;
      aiUsed = r.aiUsed;
    }

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
      extractedText: extractedText || `Content extracted from ${file.name}.`,
      summary: analysis.summary,
      findings: analysis.findings,
      limitations: analysis.limitations,
      fileName: file.name,
      aiProcessed: true,
    };

    if (!isDbConfigured()) {
      return Response.json(
        { record, aiUsed, source: 'mock', warning: 'DATABASE_URL not configured — not persisted' },
        { status: 201 }
      );
    }

    const saved = await upsertRecord(record);
    return Response.json({ record: saved, aiUsed, source: 'db' }, { status: 201 });
  } catch (err) {
    console.error('[api/upload] failed:', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}
