import { requireOwnerId } from '@/lib/auth-helpers';
import { isDbConfigured, listRecords } from '@/lib/db';
import { isGeminiConfigured, suggestResearchGaps } from '@/lib/gemini';
import { evidenceSource, fallbackGaps, type GapIdea } from '@/lib/research-intelligence';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const authz = await requireOwnerId();
  if ('error' in authz) return authz.error;
  if (!isDbConfigured()) return Response.json({ error: 'Research database is not configured' }, { status: 503 });

  try {
    const records = await listRecords(100, authz.ownerId);
    if (records.length < 2) return Response.json({ ideas: [], mode: 'insufficient', recordCount: records.length });
    const eligible = records.filter(record =>
      record.summary.keyFindings.length || record.findings.length || record.summary.limitations.length || record.limitations.length || record.extractedText.trim().length >= 200
    ).slice(0, 20);
    if (eligible.length < 2) {
      return Response.json({ ideas: fallbackGaps(records), mode: 'source-limitations', recordCount: records.length });
    }

    if (isGeminiConfigured()) {
      try {
        const result = await suggestResearchGaps(eligible);
        const byId = new Map(eligible.map(record => [record.id, record]));
        const ideas: GapIdea[] = result.ideas.map((idea, index) => ({
          id: `gap-${index}`,
          title: idea.title,
          gap: idea.gap,
          nextStep: idea.nextStep,
          sources: idea.sourceIds.flatMap(id => {
            const record = byId.get(id);
            return record ? [evidenceSource(record, idea.gap)] : [];
          }),
          generated: true,
        }));
        return Response.json({ ideas, mode: 'gemini', recordCount: records.length });
      } catch (error) {
        console.error('[api/insights] Gemini failed:', error);
      }
    }
    return Response.json({ ideas: fallbackGaps(records), mode: 'source-limitations', recordCount: records.length });
  } catch (error) {
    console.error('[api/insights] failed:', error);
    return Response.json({ error: 'Could not analyze your research library' }, { status: 500 });
  }
}
