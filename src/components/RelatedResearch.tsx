"use client";

import { findRelated, type SearchResult } from '@/lib/search';
import { useApp } from '@/lib/context';
import Link from 'next/link';

interface RelatedResearchProps {
  recordId: string;
}

export function RelatedResearch({ recordId }: RelatedResearchProps) {
  const { records } = useApp();
  const related = findRelated(recordId, records);
  if (related.length === 0) return null;

  return (
    <div className="border-t border-[var(--border)] pt-8">
      <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)] mb-4">Related research</h3>
      <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
        {related.map((result: SearchResult) => (
          <Link key={result.record.id} href={`/research/${result.record.id}`} className="group flex items-start justify-between gap-4 py-3.5 hover:bg-[var(--card)] -mx-3 px-3 transition-colors">
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-[550] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)] group-hover:text-[var(--primary)] truncate pr-4">
                {result.record.title}
              </h4>
              <p className="text-[11.5px] text-[var(--muted-foreground)] mt-0.5 capitalize">{result.record.type} · {result.relevance}% related</p>
              <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)] mt-1 line-clamp-2">{result.matchReason}</p>
            </div>
            <span className="hidden sm:inline shrink-0 text-[11px] font-medium text-[var(--text-tertiary)] group-hover:text-[var(--primary)] mt-1">View →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
