"use client";

import { useState } from 'react';
import { insightRecords } from '@/lib/mock-data';
import { InsightCard } from '@/components/InsightCard';

export default function InsightsPage() {
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const visibleInsights = insightRecords.filter(i => !dismissedInsights.includes(i.id));

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none text-[var(--foreground)]">Insights</h1>
        <p className="mt-2 text-[12.5px] leading-[1.5] text-[var(--muted-foreground)] max-w-[60ch]">
          Candidate patterns detected across your research. AI observations, not verified conclusions.
        </p>
      </div>

      {visibleInsights.length > 0 ? (
        <div className="mb-8">
          <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3 mb-2">
            <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">All observations</h2>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{visibleInsights.length} insights</span>
          </div>

          <div className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
            {visibleInsights.map((insight) => (
              <div key={insight.id} className="relative group">
                <InsightCard insight={insight} />
                <button
                  onClick={() => setDismissedInsights(prev => [...prev, insight.id])}
                  className="absolute top-3 right-0 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--foreground)] px-2 py-1"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-[var(--border)] bg-[var(--card)] mb-8">
          <p className="text-[13px] font-medium text-[var(--foreground)]">No insights yet</p>
          <p className="text-[12.5px] text-[var(--muted-foreground)] mt-1 max-w-[48ch] mx-auto">
            Insights are generated from patterns across your indexed research. Add at least two studies to start seeing observations here.
          </p>
        </div>
      )}

      <div className="border border-[var(--border)] bg-[var(--surface-hover)]/50 px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-1">About these observations</p>
        <p className="text-[12px] leading-[1.6] text-[var(--muted-foreground)]">
          Insights are automatically generated from patterns in your indexed research. They highlight candidate relationships for further investigation and are not peer-reviewed findings. Verify through appropriate methods before drawing conclusions.
        </p>
      </div>
    </div>
  );
}
