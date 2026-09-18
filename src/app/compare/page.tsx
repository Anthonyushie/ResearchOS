"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { ComparisonView } from '@/components/ComparisonView';

function CompareContent() {
  const searchParams = useSearchParams();
  const { records } = useApp();
  const preselectedA = searchParams.get('a') || '';

  const [selectedA, setSelectedA] = useState(preselectedA || (records[0]?.id ?? ''));
  const [selectedB, setSelectedB] = useState(
    preselectedA
      ? (records.find(r => r.id !== preselectedA)?.id ?? '')
      : (records[1]?.id ?? '')
  );

  const recordA = records.find(r => r.id === selectedA);
  const recordB = records.find(r => r.id === selectedB);

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none text-[var(--foreground)]">Compare</h1>
        <p className="mt-2 text-[12.5px] text-[var(--muted-foreground)]">Side-by-side review of two studies</p>
      </div>

      <div className="border-y border-[var(--border)] py-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-1.5">Study A</label>
          <select
            value={selectedA}
            onChange={(e) => setSelectedA(e.target.value)}
            className="w-full h-8 px-3 bg-[var(--card)] border border-[var(--border)] text-[12.5px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
          >
            {records.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          {recordA && <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)] font-mono truncate">{recordA.experimentName} · {recordA.date}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-1.5">Study B</label>
          <select
            value={selectedB}
            onChange={(e) => setSelectedB(e.target.value)}
            className="w-full h-8 px-3 bg-[var(--card)] border border-[var(--border)] text-[12.5px] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
          >
            {records.filter(r => r.id !== selectedA).map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          {recordB && <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)] font-mono truncate">{recordB.experimentName} · {recordB.date}</p>}
        </div>
      </div>

      {recordA && recordB && (
        <ComparisonView recordA={recordA} recordB={recordB} />
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[12.5px] text-[var(--muted-foreground)]">Loading…</div>}>
      <CompareContent />
    </Suspense>
  );
}
