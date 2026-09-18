"use client";

import type { ResearchRecord } from '@/lib/mock-data';

interface AISummaryProps {
  record: ResearchRecord;
}

export function AISummary({ record }: AISummaryProps) {
  const hasSubstance =
    record.summary.objective ||
    record.summary.method ||
    record.summary.keyFindings.length > 0;

  if (!record.aiProcessed && !hasSubstance) {
    return (
      <div className="border-t border-[var(--border)] pt-8">
        <div className="flex items-baseline gap-3 mb-4">
          <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">AI summary</h3>
        </div>
        <div className="border border-dashed border-[var(--border-strong)] bg-[var(--card)] px-4 py-5">
          <p className="text-[13px] font-medium text-[var(--foreground)]">No AI summary available</p>
          <p className="mt-1 text-[12.5px] leading-[1.6] text-[var(--muted-foreground)] max-w-[60ch]">
            {record.aiStatus === 'needs-text'
              ? 'No readable text could be extracted from this file (scanned PDF or image). AI analysis was skipped rather than guessed — add details manually via Metadata, or re-upload a text-based file.'
              : 'AI analysis did not complete for this file. Fields were left blank instead of invented — edit them manually via Metadata.'}
          </p>
        </div>
      </div>
    );
  }

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
