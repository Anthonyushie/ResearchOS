import type { NextRequest } from 'next/server';
import { listRecords, upsertRecord, isDbConfigured } from '@/lib/db';
import type { ResearchRecord } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

function isValidType(t: unknown): t is ResearchRecord['type'] {
  return t === 'paper' || t === 'experiment' || t === 'dataset';
}

export async function GET(request: NextRequest) {
  if (!isDbConfigured()) {
    return Response.json({ records: [], source: 'none', dbConfigured: false }, { status: 503 });
  }
  try {
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 100) || 100, 200);
    const records = await listRecords(limit);
    return Response.json({ records, source: 'db', dbConfigured: true });
  } catch (err) {
    console.error('[api/research GET] failed:', err);
    return Response.json({ records: [], source: 'none' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return Response.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }
  try {
    const body = (await request.json()) as Partial<ResearchRecord>;
    if (!body.title || typeof body.title !== 'string') {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }
    const record: ResearchRecord = {
      id: typeof body.id === 'string' && body.id ? body.id : `res-${Date.now().toString(36)}`,
      title: body.title,
      type: isValidType(body.type) ? body.type : 'paper',
      authors: Array.isArray(body.authors) ? body.authors.map(String) : ['Unknown Author'],
      date: typeof body.date === 'string' && body.date ? body.date : new Date().toISOString().split('T')[0],
      topics: Array.isArray(body.topics) ? body.topics.map(String) : [],
      keywords: Array.isArray(body.keywords) ? body.keywords.map(String) : [],
      variables: Array.isArray(body.variables) ? body.variables.map(String) : [],
      experimentName: typeof body.experimentName === 'string' ? body.experimentName : `EXP-${Date.now().toString(36).toUpperCase()}`,
      description: typeof body.description === 'string' ? body.description : '',
      extractedText: typeof body.extractedText === 'string' ? body.extractedText : '',
      summary: {
        objective: String(body.summary?.objective ?? ''),
        method: String(body.summary?.method ?? ''),
        keyFindings: Array.isArray(body.summary?.keyFindings) ? body.summary.keyFindings.map(String) : [],
        limitations: Array.isArray(body.summary?.limitations) ? body.summary.limitations.map(String) : [],
      },
      findings: Array.isArray(body.findings) ? body.findings.map(String) : [],
      limitations: Array.isArray(body.limitations) ? body.limitations.map(String) : [],
      fileName: typeof body.fileName === 'string' ? body.fileName : '',
      aiProcessed: Boolean(body.aiProcessed),
    };

    const saved = await upsertRecord(record);
    return Response.json({ record: saved, source: 'db' }, { status: 201 });
  } catch (err) {
    console.error('[api/research POST] failed:', err);
    return Response.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
