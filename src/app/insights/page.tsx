"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Lightbulb, Loader2, Network, Search } from 'lucide-react';
import { useApp } from '@/lib/context';
import { fallbackGaps, type AnswerPoint, type EvidenceSource, type GapIdea } from '@/lib/research-intelligence';
import { EvidenceMap } from '@/components/EvidenceMap';
import { SeedDemoButton } from '@/components/SeedDemoButton';

function Sources({ sources }: { sources: EvidenceSource[] }) {
  return <div className="mt-3 grid gap-2">
    {sources.map(source => <Link key={source.id} href={`/research/${source.id}`} className="group block border border-[var(--border)] bg-[var(--surface-hover)]/45 px-3 py-2.5 hover:border-[var(--primary)] transition-colors">
      <div className="flex items-center gap-2 text-[11px]"><span className="font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">{source.type}</span>{source.demo && <span className="text-amber-700 dark:text-amber-300">Synthetic demo data</span>}</div>
      <p className="mt-1 text-[12.5px] font-medium text-[var(--primary)] group-hover:underline">{source.title} →</p>
      {source.excerpt && <p className="mt-1 text-[11.5px] leading-[1.5] text-[var(--muted-foreground)] border-l-2 border-[var(--border-strong)] pl-2.5">{source.excerpt}</p>}
    </Link>)}
  </div>;
}

export default function InsightsPage() {
  const { records, loading } = useApp();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ points: AnswerPoint[]; mode: string; note: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const [gapIdeas, setGapIdeas] = useState<GapIdea[] | null>(null);
  const [gapMode, setGapMode] = useState('');
  const [gapLoading, setGapLoading] = useState(false);
  const [gapError, setGapError] = useState('');
  const recordKey = records.map(record => record.id).join('|');
  const localGaps = useMemo(() => fallbackGaps(records), [records]);
  const visibleGaps = gapIdeas ?? localGaps;

  useEffect(() => {
    if (loading || records.length < 2) return;
    let cancelled = false;
    async function loadGaps() {
      setGapLoading(true);
      setGapError('');
      try {
        const response = await fetch('/api/insights', { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not generate research gaps');
        if (!cancelled) { setGapIdeas(data.ideas as GapIdea[]); setGapMode(data.mode as string); }
      } catch (error) {
        if (!cancelled) setGapError(error instanceof Error ? error.message : 'Could not generate research gaps');
      } finally {
        if (!cancelled) setGapLoading(false);
      }
    }
    void loadGaps();
    return () => { cancelled = true; };
    // A changed library triggers a fresh analysis; records are read from the current render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, recordKey]);

  async function ask(event?: FormEvent<HTMLFormElement>, suggested?: string) {
    event?.preventDefault();
    const query = (suggested ?? question).trim();
    if (query.length < 5) return;
    setQuestion(query);
    setAsking(true);
    setAskError('');
    setAnswer(null);
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: query }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not answer this question');
      setAnswer({ points: data.points as AnswerPoint[], mode: data.mode as string, note: data.note as string });
    } catch (error) {
      setAskError(error instanceof Error ? error.message : 'Could not answer this question');
    } finally {
      setAsking(false);
    }
  }

  const suggestedTopic = records.find(record => record.topics.length)?.topics[0];

  return <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10 space-y-12">
    <header><h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none text-[var(--foreground)]">Insights</h1><p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--muted-foreground)] max-w-[70ch]">Ask questions, spot research gaps, and trace connections across your library. Every answer and suggestion links back to its supporting records.</p></header>

    {!loading && records.length === 0 && <div className="border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center"><p className="text-[13px] font-medium text-[var(--foreground)]">Add research to explore insights</p><p className="mt-1 text-[12px] text-[var(--muted-foreground)]">Upload a paper or try the synthetic sample library.</p><SeedDemoButton className="mt-4" /></div>}

    <section>
      <div className="flex items-center gap-2 mb-2"><Search className="h-4 w-4 text-[var(--primary)]" /><h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">Ask your research</h2></div>
      <p className="text-[12.5px] leading-[1.6] text-[var(--muted-foreground)] mb-4">Get a concise answer grounded in the records that match your question.</p>
      <form onSubmit={event => void ask(event)} className="flex flex-col sm:flex-row gap-2"><label htmlFor="research-question" className="sr-only">Question about your research</label><input id="research-question" value={question} onChange={event => setQuestion(event.target.value)} maxLength={300} placeholder="What does my research say about maize yields?" className="flex-1 min-w-0 h-10 px-3 border border-[var(--border-strong)] bg-[var(--card)] text-[13px] text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]" /><button type="submit" disabled={asking || question.trim().length < 5 || records.length === 0} className="h-10 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">{asking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}{asking ? 'Reviewing evidence…' : 'Ask ResearchOS'}</button></form>
      {suggestedTopic && !answer && !asking && <button onClick={() => void ask(undefined, `What does my research say about ${suggestedTopic}?`)} className="mt-2 text-[11.5px] text-[var(--primary)] hover:underline">Try: What does my research say about {suggestedTopic}?</button>}
      {askError && <p role="alert" className="mt-3 text-[12px] text-red-700 dark:text-red-300">{askError}</p>}
      {answer && <div className="mt-5 border border-[var(--border)] bg-[var(--card)]"><div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3"><h3 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--muted-foreground)]">Evidence-backed answer</h3><span className="text-[10.5px] text-[var(--text-tertiary)]">{answer.mode === 'gemini' ? 'Gemini synthesis' : answer.mode === 'source-excerpts' ? 'Direct source findings' : 'No matching evidence'}</span></div>{answer.points.length ? <div className="divide-y divide-[var(--border)]">{answer.points.map((point, index) => <div key={index} className="p-4"><p className="text-[13px] leading-[1.6] font-medium text-[var(--foreground)]">{point.claim}</p><Sources sources={point.sources} /></div>)}</div> : <p className="p-4 text-[12.5px] text-[var(--muted-foreground)]">The library does not contain enough matching evidence to answer this question.</p>}{answer.note && <p className="px-4 py-3 border-t border-[var(--border)] text-[11.5px] leading-[1.5] text-[var(--muted-foreground)]">{answer.note}</p>}</div>}
    </section>

    <section>
      <div className="flex items-center justify-between gap-3 mb-2"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[var(--primary)]" /><h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">Research gap radar</h2></div>{gapLoading && <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]"><Loader2 className="h-3 w-3 animate-spin" /> Generating ideas…</span>}</div>
      <p className="text-[12.5px] leading-[1.6] text-[var(--muted-foreground)] mb-4">Follow-up experiments suggested by the findings and stated limitations in your records.</p>
      {visibleGaps.length ? <div className="grid gap-4 md:grid-cols-2">{visibleGaps.map((idea, index) => <article key={idea.id} className="border border-[var(--border)] bg-[var(--card)] p-4"><div className="flex items-center justify-between gap-3 mb-2"><span className="text-[10.5px] font-semibold tracking-[0.07em] uppercase text-[var(--text-tertiary)]">Opportunity {index + 1}</span><span className="text-[10.5px] text-[var(--text-tertiary)]">{idea.generated ? 'Gemini suggestion' : 'Source limitation'}</span></div><h3 className="text-[14px] font-semibold leading-[1.4] text-[var(--foreground)]">{idea.title}</h3><p className="mt-2 text-[12px] leading-[1.6] text-[var(--muted-foreground)]">{idea.gap}</p><div className="mt-3 border-l-2 border-[var(--primary)] pl-3"><p className="text-[10.5px] uppercase tracking-[0.06em] font-semibold text-[var(--primary)]">Next experiment</p><p className="mt-1 text-[12px] leading-[1.6] text-[var(--foreground)]">{idea.nextStep}</p></div><Sources sources={idea.sources} /></article>)}</div> : <div className="border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center"><p className="text-[12.5px] font-medium text-[var(--foreground)]">{records.length < 2 ? 'Add at least two records to explore research gaps' : 'No stated limitations found yet'}</p><p className="mt-1 text-[11.5px] text-[var(--muted-foreground)]">Research gaps are suggestions to investigate, not verified conclusions.</p></div>}
      {gapError && <p className="mt-3 text-[11.5px] text-[var(--muted-foreground)]">AI suggestions could not load. Showing limitations from your records. {gapError}</p>}
      {gapMode === 'source-limitations' && !gapError && <p className="mt-3 text-[11px] text-[var(--text-tertiary)]">Showing source limitations because Gemini suggestions were unavailable.</p>}
    </section>

    <section><div className="flex items-center gap-2 mb-2"><Network className="h-4 w-4 text-[var(--primary)]" /><h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">Evidence map</h2></div><EvidenceMap records={records} /></section>
    <p className="border-t border-[var(--border)] pt-4 text-[11.5px] leading-[1.6] text-[var(--text-tertiary)]">AI outputs are candidate interpretations of your library. Review the linked source records before using a finding or experiment proposal.</p>
  </div>;
}
