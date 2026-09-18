"use client";

import { useEffect, useState } from 'react';
import type { ResearchRecord } from '@/lib/mock-data';
import { mockGenerateComparison } from '@/lib/ai';

interface ComparisonViewProps {
  recordA: ResearchRecord;
  recordB: ResearchRecord;
}

export function ComparisonView({ recordA, recordB }: ComparisonViewProps) {
  const [comparison, setComparison] = useState<{ similarities: string[]; differences: string[] } | null>(null);
  const [aiUsed, setAiUsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordA, recordB }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setComparison({ similarities: data.similarities, differences: data.differences });
          setAiUsed(Boolean(data.aiUsed));
        }
      } catch {
        // Offline / backend down → generic comparison from the real records
        if (!cancelled) {
          setComparison(mockGenerateComparison(recordA, recordB));
          setAiUsed(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordA.id, recordB.id]);

  const rows = [
    { label: 'Objective', a: recordA.summary.objective, b: recordB.summary.objective },
    { label: 'Method', a: recordA.summary.method, b: recordB.summary.method },
    { label: 'Variables', a: recordA.variables.join(', '), b: recordB.variables.join(', ') },
    { label: 'Key findings', a: recordA.summary.keyFindings.join(' · '), b: recordB.summary.keyFindings.join(' · ') },
    { label: 'Limitations', a: recordA.summary.limitations.join(' · '), b: recordB.summary.limitations.join(' · ') },
    { label: 'File', a: recordA.fileName, b: recordB.fileName, mono: true },
  ];

  return (
    <div className="space-y-8">
      {/* AI analysis */}
      <div className="border border-[var(--border)] bg-[var(--card)]">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">
            {aiUsed ? 'Gemini comparison' : 'AI comparison'}
          </h3>
          {loading && <span className="text-[11px] text-[var(--text-tertiary)]">Analyzing…</span>}
        </div>
        {loading || !comparison ? (
          <div className="p-5 text-[12.5px] text-[var(--muted-foreground)]">Generating comparison…</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
            <div className="p-5">
              <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--primary)] mb-3">Similarities</h4>
              <ul className="space-y-2.5">
                {comparison.similarities.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.6] text-[var(--foreground)]">
                    <span className="mt-[7px] w-1 h-1 rounded-full bg-[var(--primary)] shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5">
              <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--text-secondary)] mb-3">Differences</h4>
              <ul className="space-y-2.5">
                {comparison.differences.map((d, i) => (
                  <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.6] text-[var(--foreground)]">
                    <span className="mt-[7px] w-1 h-1 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="px-5 py-3 bg-[#FFFBEB] dark:bg-amber-950/40 border-t border-[var(--border)]">
          <p className="text-[11px] leading-[1.5] text-[#854D0E] dark:text-amber-200/90">AI-generated comparison · requires verification against source documents.</p>
        </div>
      </div>

      {/* Side-by-side */}
      <div className="border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b border-[var(--border)] bg-[var(--surface-hover)]">
          <div className="col-span-3 lg:col-span-2 px-4 py-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Attribute</div>
          <div className="col-span-9 lg:col-span-5 px-4 py-3 text-[12px] font-medium tracking-[-0.01em] text-[var(--foreground)] border-l border-[var(--border)] truncate">{recordA.title}</div>
          <div className="hidden lg:block lg:col-span-5 px-4 py-3 text-[12px] font-medium tracking-[-0.01em] text-[var(--foreground)] border-l border-[var(--border)] truncate">{recordB.title}</div>
        </div>
        {/* Mobile second header row */}
        <div className="lg:hidden px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-hover)]">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">{recordB.title}</span>
        </div>

        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-12 gap-0 border-b border-[var(--border)] last:border-0">
            <div className="col-span-12 lg:col-span-2 px-4 py-4 bg-[var(--surface-hover)]/50 lg:bg-transparent">
              <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)]">{row.label}</span>
            </div>
            <div className={`col-span-12 lg:col-span-5 px-4 py-4 border-t lg:border-t-0 lg:border-l border-[var(--border)] text-[12.5px] leading-[1.6] ${row.mono ? 'font-mono text-[var(--muted-foreground)] text-[11.5px]' : 'text-[var(--foreground)]'}`}>
              {row.a}
            </div>
            <div className={`col-span-12 lg:col-span-5 px-4 py-4 border-t lg:border-t-0 lg:border-l border-[var(--border)] text-[12.5px] leading-[1.6] ${row.mono ? 'font-mono text-[var(--muted-foreground)] text-[11.5px]' : 'text-[var(--foreground)]'}`}>
              {row.b}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
