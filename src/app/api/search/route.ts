import type { NextRequest } from 'next/server';
import { searchRecords, isDbConfigured } from '@/lib/db';
import { requireOwnerId } from '@/lib/auth-helpers';
import { searchResearch } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return Response.json({ results: [], query: q });
  if (!isDbConfigured()) {
    return Response.json({ results: [], query: q, source: 'none' }, { status: 503 });
  }
  try {
    const records = await searchRecords(q, authz.ownerId, 20);
    // Reuse local relevance scorer for consistent UI ranking
    const local = searchResearch(q, records);
    const scoreById = new Map(local.map((r) => [r.record.id, r]));
    const results = records.map((record) => {
      const s = scoreById.get(record.id);
      return (
        s ?? {
          record,
          relevance: 50,
          matchReason: `This ${record.type} matches "${q}" in the database.`,
          matchingTopics: record.topics.slice(0, 3),
          excerpt: record.description,
        }
      );
    });
    return Response.json({ results, query: q, source: 'db' });
  } catch (err) {
    console.error('[api/search] failed:', err);
    return Response.json({ results: [], query: q, source: 'none' }, { status: 503 });
  }
}
