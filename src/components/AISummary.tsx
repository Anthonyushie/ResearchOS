"use client";

import type { ResearchRecord } from '@/lib/mock-data';

interface AISummaryProps {
  record: ResearchRecord;
}

export function AISummary({ record }: AISummaryProps) {
  return (
    <div className="border-t border-[var(--border)] pt-8">
      <div className="flex items-baseline gap-3 mb-6">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">AI summary</h3>
        <span className="text-[11px] text-[var(--text-tertiary)]">Generated from</span>
        <span className="text-[11px] font-mono text-[var(--muted-foreground)]">{record.fileName}</span>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--foreground)] mb-2">Objective</h4>
          <p className="text-[13.5px] leading-[1.65] text-[var(--foreground)] max-w-[65ch]">{record.summary.objective}</p>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--foreground)] mb-2">Method</h4>
          <p className="text-[13.5px] leading-[1.65] text-[var(--foreground)] max-w-[65ch]">{record.summary.method}</p>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--foreground)] mb-2">Key findings</h4>
          <ul className="space-y-2">
            {record.summary.keyFindings.map((finding, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-[1.6] text-[var(--foreground)] max-w-[65ch]">
                <span className="mt-[9px] w-1 h-1 rounded-full bg-[var(--primary)] shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#8B3A3A] dark:text-red-300/90 mb-2">Limitations</h4>
          <ul className="space-y-2">
            {record.summary.limitations.map((limitation, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-[1.6] text-[var(--text-secondary)] max-w-[65ch]">
                <span className="mt-[9px] w-1 h-1 rounded-full bg-[var(--border-strong)] shrink-0" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 border border-[var(--border)] bg-[#FFFBEB] dark:bg-amber-950/40 px-3 py-2.5">
        <p className="text-[11px] leading-[1.5] text-[#854D0E] dark:text-amber-200/90">
          <span className="font-semibold">Verification required.</span> AI-generated summary derived from source document. Verify against the original file before citing.
        </p>
      </div>
    </div>
  );
}
