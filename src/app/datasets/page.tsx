"use client";

import { useMemo } from 'react';
import { useApp } from '@/lib/context';
import { UploadModal } from '@/components/UploadModal';
import Link from 'next/link';

export default function DatasetsPage() {
  const { records } = useApp();
  const datasets = useMemo(() => records.filter(r => r.type === 'dataset'), [records]);

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      <UploadModal />

      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none text-[var(--foreground)]">Datasets</h1>
        <p className="mt-2 text-[12.5px] text-[var(--muted-foreground)]">{datasets.length} datasets indexed</p>
      </div>

      <div className="border-y border-[var(--border)] py-3 mb-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">
          Tabular data indexed for search and comparison
        </p>
      </div>

      {datasets.length > 0 ? (
        <>
          <div className="hidden lg:grid grid-cols-12 gap-4 px-3 py-2 border-b border-[var(--border)]">
            <div className="col-span-7 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Dataset</div>
            <div className="col-span-2 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">File</div>
            <div className="col-span-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)] text-right">Updated</div>
          </div>

          <div className="border-b border-[var(--border)]">
            {datasets.map((record) => (
              <Link
                key={record.id}
                href={`/research/${record.id}`}
                className="group grid grid-cols-12 gap-3 lg:gap-4 px-3 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-colors"
              >
                <div className="col-span-12 lg:col-span-7 min-w-0">
                  <h3 className="text-[13.5px] font-[550] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)] group-hover:text-[var(--primary)]">
                    {record.title}
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-[1.4] text-[var(--muted-foreground)] line-clamp-2">{record.description}</p>
                  <p className="mt-1 text-[11px] text-[var(--text-tertiary)] truncate">{record.variables.slice(0, 3).join(' · ')}</p>
                </div>
                <div className="col-span-6 lg:col-span-2 flex items-center">
                  <span className="text-[11px] font-mono text-[var(--muted-foreground)] truncate">{record.fileName}</span>
                </div>
                <div className="col-span-6 lg:col-span-3 flex items-center justify-between lg:justify-end gap-3">
                  <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{record.date}</span>
                  <span className="hidden lg:inline text-[11px] font-medium text-[var(--text-tertiary)] group-hover:text-[var(--primary)]">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="py-16 text-center border border-dashed border-[var(--border)] bg-[var(--card)]">
          <p className="text-[13px] font-medium text-[var(--foreground)]">No datasets yet</p>
          <p className="text-[12.5px] text-[var(--muted-foreground)] mt-1">Upload a CSV or tabular file to index it.</p>
        </div>
      )}
    </div>
  );
}
