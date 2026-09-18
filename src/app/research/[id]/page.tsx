"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/lib/context';
import { MetadataPanel } from '@/components/MetadataPanel';
import { AISummary } from '@/components/AISummary';
import { RelatedResearch } from '@/components/RelatedResearch';
import Link from 'next/link';

export default function ResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { records } = useApp();
  const record = records.find(r => r.id === id);

  if (!record) {
    return (
      <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-12">
        <div className="border border-dashed border-[var(--border)] bg-[var(--card)] py-12 text-center">
          <p className="text-[13px] font-medium text-[var(--foreground)]">Record not found</p>
          <button onClick={() => router.push('/research')} className="mt-3 text-[12.5px] text-[var(--primary)] hover:underline underline-offset-4">← Back to research</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Back
      </button>

      {/* Document header */}
      <div className="border-b border-[var(--foreground)] pb-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] border border-[var(--border)] bg-[var(--card)] px-2 py-1">
            {record.type}
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">·</span>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">{record.date}</span>
          {record.aiProcessed ? (
            <>
              <span className="text-[11px] text-[var(--text-tertiary)]">·</span>
              {record.aiStatus === 'demo' ? (
                <span className="text-[11px] font-medium text-[#6D28D9] dark:text-violet-300">
                  Demo data
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[var(--primary)]">
                  AI-indexed{record.aiModel ? ` · ${record.aiModel}` : ''}
                </span>
              )}
            </>
          ) : record.aiStatus === 'needs-text' ? (
            <>
              <span className="text-[11px] text-[var(--text-tertiary)]">·</span>
              <span className="text-[11px] font-medium text-[#B45309] dark:text-amber-300">
                Text unreadable — AI skipped
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] text-[var(--text-tertiary)]">·</span>
              <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
                AI unavailable
              </span>
            </>
          )}
        </div>

        <h1 className="text-[24px] lg:text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-[var(--foreground)] max-w-[28ch]">
          {record.title}
        </h1>

        <p className="mt-3 text-[13px] leading-[1.5] text-[var(--muted-foreground)]">
          {record.authors.join(', ')} · <span className="font-mono text-[12px]">{record.experimentName}</span>
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {record.topics.map((topic) => (
            <span key={topic} className="text-[11px] px-2 py-1 bg-[var(--muted)] border border-[var(--border)] text-[var(--text-secondary)]">
              {topic}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/compare?a=${record.id}`} className="inline-flex h-8 items-center px-3 border border-[var(--border)] bg-[var(--card)] text-[12.5px] font-medium text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors">
            Compare
          </Link>
          <a href="#related" className="inline-flex h-8 items-center px-3 border border-[var(--border)] bg-[var(--card)] text-[12.5px] font-medium text-[var(--foreground)] hover:border-[var(--foreground)] transition-colors">
            Find related
          </a>
          <Link href="/insights" className="inline-flex h-8 items-center px-3 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-medium hover:opacity-90 transition-opacity">
            View insights
          </Link>
        </div>
      </div>

      {/* Editorial layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-7">
          <div className="prose max-w-none">
            <div className="mb-8">
              <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)] mb-3">Overview</h2>
              <p className="text-[13.5px] leading-[1.7] text-[var(--foreground)]">{record.description}</p>
              <div className="mt-4 border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-2">Source text excerpt</p>
                <p className="text-[12.5px] leading-[1.65] text-[var(--text-secondary)] font-mono bg-[var(--surface-hover)] p-3 border border-[var(--border)]">
                  {record.extractedText.slice(0, 420)}…
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-2 font-mono">{record.fileName}</p>
              </div>
            </div>

            <AISummary record={record} />

            <div id="related" className="mt-8">
              <RelatedResearch recordId={record.id} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[72px] space-y-6">
            <MetadataPanel record={record} />

            <div className="border border-[var(--border)] bg-[var(--surface-hover)]/40 p-4">
              <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-3">Variables</h3>
              <ul className="space-y-2">
                {record.variables.map((v) => (
                  <li key={v} className="flex gap-2 text-[12.5px] leading-[1.5] text-[var(--foreground)]">
                    <span className="mt-[7px] w-1 h-1 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                    <span className="font-mono text-[11.5px]">{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[var(--border)] bg-[var(--card)] p-4">
              <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-2">Citation</h3>
              <p className="text-[12px] leading-[1.6] text-[var(--text-secondary)] font-mono">
                {record.authors.join(', ')}. ({record.date}). <em>{record.title}</em>. {record.experimentName}. {record.fileName}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
