import type { NextRequest } from 'next/server';
import { requireOwnerId } from '@/lib/auth-helpers';
import { isDbConfigured, listRecords } from '@/lib/db';
import { answerResearchQuestion, isGeminiConfigured } from '@/lib/gemini';
import { searchResearch } from '@/lib/search';
import { evidenceSource, fallbackAnswer, type AnswerPoint } from '@/lib/research-intelligence';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  if (!isDbConfigured()) return Response.json({ error: 'Research database is not configured' }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const question = body && typeof body === 'object' && 'question' in body && typeof body.question === 'string'
    ? body.question.trim()
    : '';
  if (question.length < 5 || question.length > 300) {
    return Response.json({ error: 'Question must be 5–300 characters' }, { status: 400 });
  }

  try {
    const records = await listRecords(100, authz.ownerId);
    const candidates = searchResearch(question, records).slice(0, 6).map(result => result.record);
    if (!candidates.length) {
      return Response.json({ points: [], mode: 'no-evidence', note: 'No indexed records matched this question. Try a topic, crop, variable, or finding from your library.', recordCount: 0 });
    }

    let points: AnswerPoint[];
    let mode: 'gemini' | 'source-excerpts' = 'source-excerpts';
    let note = 'Gemini was unavailable, so these are direct findings from matching records rather than a generated synthesis.';
    if (isGeminiConfigured()) {
      try {
        const answer = await answerResearchQuestion(question, candidates);
        const byId = new Map(candidates.map(record => [record.id, record]));
        points = answer.points.map(point => ({
          claim: point.claim,
          sources: point.sourceIds.flatMap(id => {
            const record = byId.get(id);
            return record ? [evidenceSource(record, point.claim)] : [];
          }),
        }));
        mode = 'gemini';
        note = answer.uncertainty;
      } catch (error) {
        console.error('[api/ask] Gemini failed:', error);
        points = fallbackAnswer(candidates);
      }
    } else {
      points = fallbackAnswer(candidates);
    }
    return Response.json({ points, mode, note, recordCount: candidates.length });
  } catch (error) {
    console.error('[api/ask] failed:', error);
    return Response.json({ error: 'Could not search your research library' }, { status: 500 });
  }
}
