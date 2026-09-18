"use client";

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '@/lib/context';
import { UploadModal } from '@/components/UploadModal';
import Link from 'next/link';

type FilterType = 'all' | 'paper' | 'experiment' | 'dataset';

export default function ResearchPage() {
  const { records } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter !== 'all' && r.type !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.keywords.some(k => k.toLowerCase().includes(q)) ||
          r.topics.some(t => t.toLowerCase().includes(q)) ||
          r.authors.some(a => a.toLowerCase().includes(q)) ||
          r.variables.some(v => v.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [records, filter, searchQuery]);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'paper', label: 'Papers' },
    { value: 'experiment', label: 'Experiments' },
    { value: 'dataset', label: 'Datasets' },
  ];

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      <UploadModal />

      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none text-[var(--foreground)]">Research</h1>
        <p className="mt-2 text-[12.5px] text-[var(--muted-foreground)]">
          {records.length} records · {filteredRecords.length} showing
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between border-y border-[var(--border)] py-3 mb-2">
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] border transition-colors ${
                filter === f.value
                  ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" strokeWidth={1.75} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, topic, variable…"
            className="w-full h-8 pl-8 pr-3 bg-[var(--card)] border border-[var(--border)] text-[12.5px] text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Table header */}
      {filteredRecords.length > 0 && (
        <div className="hidden lg:grid grid-cols-12 gap-4 px-3 py-2 border-b border-[var(--border)]">
          <div className="col-span-7 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Title</div>
          <div className="col-span-2 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Type</div>
          <div className="col-span-3 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)] text-right">Updated</div>
        </div>
      )}

      {/* List */}
      {filteredRecords.length > 0 ? (
        <div className="border-b border-[var(--border)]">
          {filteredRecords.map((record) => (
            <Link
              key={record.id}
              href={`/research/${record.id}`}
              className="group grid grid-cols-12 gap-3 lg:gap-4 px-3 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-colors"
            >
              <div className="col-span-12 lg:col-span-7 min-w-0">
                <h3 className="text-[13.5px] font-[550] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)] group-hover:text-[var(--primary)] line-clamp-2">
                  {record.title}
                </h3>
                <p className="mt-1 text-[11.5px] leading-[1.4] text-[var(--muted-foreground)] truncate">
                  {record.authors.join(', ')} · {record.experimentName}
                </p>
                <p className="mt-1 hidden sm:block text-[11.5px] leading-[1.4] text-[var(--text-tertiary)] truncate">
                  {record.topics.join(' · ')}
                </p>
              </div>

              <div className="col-span-6 lg:col-span-2 flex items-center">
                <span className="text-[12px] leading-none text-[var(--muted-foreground)] capitalize border border-[var(--border)] bg-[var(--card)] px-2 py-1">
                  {record.type}
                </span>
              </div>

              <div className="col-span-6 lg:col-span-3 flex items-center justify-between lg:justify-end gap-3">
                <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{record.date}</span>
                <span className="hidden lg:inline text-[11px] font-medium text-[var(--text-tertiary)] group-hover:text-[var(--primary)]">View →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-[var(--border)] bg-[var(--card)] mt-4">
          <p className="text-[13px] font-medium text-[var(--foreground)]">No matching research</p>
          <p className="text-[12.5px] text-[var(--muted-foreground)] mt-1">Try a different filter or search term.</p>
        </div>
      )}
    </div>
  );
}
