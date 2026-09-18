import type { NextRequest } from 'next/server';
import { getRecord, isDbConfigured } from '@/lib/db';
import { requireOwnerId } from '@/lib/auth-helpers';
import type { ResearchRecord } from '@/lib/mock-data';
import { compareResearch } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

async function resolveRecord(
  id: string,
  ownerId: string,
  fallback?: ResearchRecord
): Promise<ResearchRecord | null> {
  if (fallback && fallback.id === id) return fallback;
  if (isDbConfigured()) {
    const rec = await getRecord(id, ownerId);
    if (rec) return rec;
  }
  return fallback ?? null;
}

export async function POST(request: NextRequest) {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  try {
    const body = (await request.json()) as {
      idA?: string;
      idB?: string;
      recordA?: ResearchRecord;
      recordB?: ResearchRecord;
    };
    const recordA = body.recordA ?? (body.idA ? await resolveRecord(body.idA, authz.ownerId) : null);
    const recordB = body.recordB ?? (body.idB ? await resolveRecord(body.idB, authz.ownerId) : null);

    if (!recordA || !recordB) {
      return Response.json({ error: 'Two records (idA/idB or recordA/recordB) are required' }, { status: 400 });
    }
    if (recordA.id === recordB.id) {
      return Response.json({ error: 'Choose two different records to compare' }, { status: 400 });
    }

    const { similarities, differences, aiUsed } = await compareResearch(recordA, recordB);
    return Response.json({ similarities, differences, aiUsed });
  } catch (err) {
    console.error('[api/compare] failed:', err);
    return Response.json({ error: 'Failed to generate comparison' }, { status: 500 });
  }
}
