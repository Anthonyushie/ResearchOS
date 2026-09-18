"use client";

import Link from 'next/link';
import type { ResearchRecord } from '@/lib/mock-data';

interface ResearchCardProps {
  record: ResearchRecord;
  compact?: boolean;
}

function TypeLabel({ type }: { type: ResearchRecord['type'] }) {
  const labels: Record<string, string> = {
    paper: 'Paper',
    experiment: 'Experiment',
    dataset: 'Dataset',
  };
  return (
    <span className="text-[11px] font-medium tracking-[-0.01em] text-[var(--muted-foreground)]">
      {labels[type]}
    </span>
  );
}

export function ResearchCard({ record, compact }: ResearchCardProps) {
  return (
    <Link
      href={`/research/${record.id}`}
      className="group block py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)]/60 -mx-3 px-3 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TypeLabel type={record.type} />
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span className="text-[11px] text-[var(--text-tertiary)]">{record.date}</span>
            {record.aiProcessed && (
              <>
                <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                <span className="text-[11px] tracking-wide text-[var(--primary)] font-medium">Indexed</span>
              </>
            )}
          </div>

          <h3 className="text-[14px] font-[550] leading-[1.35] tracking-[-0.01em] text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2">
            {record.title}
          </h3>

          {!compact && (
            <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--muted-foreground)] line-clamp-2">
              {record.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11.5px] text-[var(--text-tertiary)]">
            <span className="truncate">{record.authors[0]}{record.authors.length > 1 ? ` · +${record.authors.length - 1}` : ''}</span>
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
              <span className="truncate">{record.topics.slice(0, 2).join(' · ')}</span>
            </span>
          </div>
        </div>

        <span className="hidden sm:inline-flex shrink-0 mt-1 text-[11px] font-medium tracking-wide text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors">
          View →
        </span>
      </div>
    </Link>
  );
}

/* Row variant for table-like lists */
export function ResearchRow({ record }: { record: ResearchRecord }) {
  return (
    <Link
      href={`/research/${record.id}`}
      className="group grid grid-cols-12 gap-4 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] -mx-3 px-3 transition-colors items-center"
    >
      <div className="col-span-12 lg:col-span-7 min-w-0">
        <h3 className="text-[13.5px] font-[550] leading-[1.35] tracking-[-0.01em] text-[var(--foreground)] group-hover:text-[var(--primary)] truncate pr-4">
          {record.title}
        </h3>
        <p className="text-[12px] leading-[1.4] text-[var(--muted-foreground)] truncate mt-0.5">
          {record.authors.join(', ')} · {record.experimentName}
        </p>
      </div>

      <div className="col-span-6 lg:col-span-2">
        <span className="text-[12px] text-[var(--muted-foreground)] capitalize">{record.type}</span>
      </div>

      <div className="col-span-6 lg:col-span-3 flex items-center justify-between gap-3">
        <span className="text-[12px] text-[var(--text-tertiary)] font-mono">{record.date}</span>
        <span className="hidden lg:inline-flex text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--primary)]">View →</span>
      </div>
    </Link>
  );
}
