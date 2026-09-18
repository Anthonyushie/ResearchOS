"use client";

import type { InsightRecord } from '@/lib/mock-data';
import { useApp } from '@/lib/context';
import Link from 'next/link';

interface InsightCardProps {
  insight: InsightRecord;
  compact?: boolean;
}

export function InsightCard({ insight, compact }: InsightCardProps) {
  const { records } = useApp();
  const sources = insight.sourceIds
    .map(id => records.find(r => r.id === id))
    .filter(Boolean);

  return (
    <div className="py-4 border-b border-[var(--border)] last:border-0">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[var(--text-tertiary)]">{insight.category}</span>
        {insight.correlation !== undefined && (
          <>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span className="text-[11px] font-medium text-[var(--primary)]">r = +{insight.correlation.toFixed(2)}</span>
          </>
        )}
      </div>

      <h3 className="text-[13.5px] font-[550] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)]">{insight.title}</h3>
      <p className="mt-1 text-[12.5px] leading-[1.6] text-[var(--muted-foreground)]">{insight.description}</p>

      {!compact && sources.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {sources.map((s) => s && (
            <Link
              key={s.id}
              href={`/research/${s.id}`}
              className="text-[11px] text-[var(--primary)] hover:underline underline-offset-4 border border-[var(--border)] bg-[var(--card)] px-2 py-1"
            >
              {s.title.slice(0, 42)}…
            </Link>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-[11px] leading-[1.4] text-[var(--text-tertiary)] border-l-2 border-[var(--border)] pl-2.5">
        AI observation · requires verification
      </p>
    </div>
  );
}
