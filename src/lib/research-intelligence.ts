import type { ResearchRecord } from './mock-data';

export interface EvidenceSource {
  id: string;
  title: string;
  type: ResearchRecord['type'];
  excerpt: string;
  demo: boolean;
}

export interface AnswerPoint {
  claim: string;
  sources: EvidenceSource[];
}

export interface GapIdea {
  id: string;
  title: string;
  gap: string;
  nextStep: string;
  sources: EvidenceSource[];
  generated: boolean;
}

const commonWords = new Set(['about', 'after', 'also', 'from', 'into', 'more', 'only', 'over', 'that', 'their', 'there', 'these', 'this', 'those', 'were', 'what', 'when', 'where', 'which', 'with']);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(word => !commonWords.has(word)) ?? [];
}

export function evidenceSource(record: ResearchRecord, focus: string): EvidenceSource {
  const candidates = [
    ...record.summary.keyFindings,
    ...record.findings,
    ...record.summary.limitations,
    ...record.limitations,
    ...record.extractedText.split(/(?<=[.!?])\s+|\n+/).filter(Boolean),
    record.description,
  ].filter(text => text && !text.startsWith('No readable text extracted'));
  const focusWords = new Set(words(focus));
  const ranked = candidates.map((text, index) => ({
    text,
    index,
    score: words(text).reduce((score, word) => score + (focusWords.has(word) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  const excerpt = (ranked[0]?.text ?? record.description ?? '').trim();
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    excerpt: excerpt.length > 260 ? `${excerpt.slice(0, 257).trimEnd()}…` : excerpt,
    demo: record.aiStatus === 'demo',
  };
}

export function fallbackAnswer(records: ResearchRecord[]): AnswerPoint[] {
  return records.slice(0, 3).map(record => {
    const claim = record.summary.keyFindings[0] || record.findings[0] || record.description || record.summary.objective;
    return claim ? { claim, sources: [evidenceSource(record, claim)] } : null;
  }).filter((point): point is AnswerPoint => point !== null);
}

/** Source-derived suggestions shown immediately while Gemini is unavailable or loading. */
export function fallbackGaps(records: ResearchRecord[]): GapIdea[] {
  if (records.length < 2) return [];
  const candidates = records.flatMap(record => {
    const limitations = [...new Set([...record.summary.limitations, ...record.limitations].map(value => value.trim()).filter(Boolean))];
    return limitations.map((limitation, index) => ({ record, limitation, index }));
  });
  const chosen: typeof candidates = [];
  for (const candidate of candidates) {
    if (chosen.length >= 3) break;
    if (candidate.index === 0 || chosen.length >= records.length) chosen.push(candidate);
  }
  return chosen.map(({ record, limitation, index }) => ({
    id: `${record.id}-${index}`,
    title: limitation.length > 90 ? `${limitation.slice(0, 87).trimEnd()}…` : limitation,
    gap: `A stated limitation of “${record.title}”.`,
    nextStep: 'Design a follow-up study that addresses this limitation, then compare its results with the original record.',
    sources: [evidenceSource(record, limitation)],
    generated: false,
  }));
}
