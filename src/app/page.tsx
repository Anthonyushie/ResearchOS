"use client";

import { useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import { searchResearch, type SearchResult } from '@/lib/search';
import { fallbackGaps } from '@/lib/research-intelligence';
import { useApp } from '@/lib/context';
import { ResearchCard } from '@/components/ResearchCard';
import { SearchBar } from '@/components/SearchBar';
import { UploadModal } from '@/components/UploadModal';
import { SeedDemoButton } from '@/components/SeedDemoButton';
import Link from 'next/link';

export default function DashboardPage() {
  const { records, loading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setHasSearched(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setSearchResults(data.results);
      } catch {
        // Offline / backend down → local search over loaded records
        setSearchResults(searchResearch(query, records));
      }
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const suggestedQueries = [
    'soil nitrogen levels',
    'plant growth experiments',
    'fertilizer response',
    'datasets with yield data',
  ];

  const recentRecords = records.slice(0, 5);
  const researchGaps = fallbackGaps(records);
  const recentInsights = researchGaps.slice(0, 3);
  const paperCount = records.filter((r) => r.type === 'paper').length;
  const experimentCount = records.filter((r) => r.type === 'experiment').length;
  const datasetCount = records.filter((r) => r.type === 'dataset').length;

  return (
    <div className="max-w-[960px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      <UploadModal />

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-none text-[var(--foreground)]">Research workspace</h1>
            <p className="mt-2 text-[13px] leading-[1.5] text-[var(--muted-foreground)]">
              {loading
                ? 'Loading library…'
                : `${records.length} records · ${datasetCount} datasets · ${experimentCount} experiments · ${researchGaps.length} research gaps`}
            </p>
          </div>
          <Link href="/research" className="hidden sm:inline-flex text-[12.5px] font-medium text-[var(--primary)] hover:underline underline-offset-4 shrink-0">
            Browse library →
          </Link>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search across papers, experiments, datasets…"
        />
        {!hasSearched && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] tracking-wide uppercase font-semibold text-[var(--text-tertiary)] mr-1">Try</span>
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleSearch(q)}
                className="text-[12.5px] leading-none px-2.5 py-1.5 border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search results */}
      {hasSearched ? (
        <div className="space-y-6">
          <div className="flex items-baseline gap-3 border-b border-[var(--border)] pb-3">
            <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">Search results</h2>
            <span className="text-[12.5px] text-[var(--muted-foreground)]">
              {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for “{searchQuery}”
            </span>
            <button
              onClick={() => { setHasSearched(false); setSearchQuery(''); setSearchResults([]); }}
              className="ml-auto text-[12.5px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {searchResults.map((result) => (
                <div key={result.record.id} className="py-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-medium text-[var(--muted-foreground)] capitalize">{result.record.type}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                        <span className="text-[11px] text-[var(--text-tertiary)]">{result.relevance}% match</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                        <span className="text-[11px] text-[var(--text-tertiary)]">{result.record.date}</span>
                      </div>
                      <Link href={`/research/${result.record.id}`} className="group">
                        <h3 className="text-[14px] font-[550] leading-[1.35] tracking-[-0.01em] text-[var(--foreground)] group-hover:text-[var(--primary)]">
                          {result.record.title}
                        </h3>
                      </Link>
                      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--muted-foreground)] max-w-[60ch]">
                        {result.matchReason}
                      </p>
                      <p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--text-secondary)] line-clamp-2 border-l-2 border-[var(--border)] pl-3">
                        {result.excerpt}
                      </p>
                      {result.matchingTopics.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {result.matchingTopics.map((t) => (
                            <span key={t} className="text-[11px] px-2 py-1 bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/research/${result.record.id}`}
                      className="hidden sm:inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-[var(--primary)] hover:underline underline-offset-4 mt-1"
                    >
                      Open <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-[var(--border)] bg-[var(--card)]">
              <Search className="h-5 w-5 text-[var(--text-tertiary)] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[13px] font-medium text-[var(--foreground)]">No matching research found</p>
              <p className="text-[12.5px] text-[var(--muted-foreground)] mt-1">Try different keywords or check for typos.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Recent research — editorial list, not cards */}
          <section>
            <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3 mb-1">
              <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">Recent research</h2>
              <Link href="/research" className="text-[12.5px] font-medium text-[var(--primary)] hover:underline underline-offset-4">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {loading ? (
                <p className="py-8 text-[12.5px] text-[var(--muted-foreground)]">Loading library…</p>
              ) : recentRecords.length > 0 ? (
                recentRecords.map((record) => (
                  <ResearchCard key={record.id} record={record} />
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-[var(--border)] bg-[var(--card)]">
                  <p className="text-[13px] font-medium text-[var(--foreground)]">Your library is empty</p>
                  <p className="text-[12.5px] text-[var(--muted-foreground)] mt-1">
                    Add your first research file, or explore with sample data.
                  </p>
                  <SeedDemoButton className="mt-4" />
                </div>
              )}
            </div>
          </section>

          {/* Observations + At a glance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-8">
              <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3 mb-1">
                <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">Research gaps</h2>
                <Link href="/insights" className="text-[12.5px] font-medium text-[var(--primary)] hover:underline underline-offset-4">
                  Explore insights →
                </Link>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {recentInsights.length > 0 ? recentInsights.map((insight) => (
                  <div key={insight.id} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-[var(--text-tertiary)]">Stated limitation</span>
                        </div>
                        <h3 className="text-[13.5px] font-[550] leading-[1.4] tracking-[-0.01em] text-[var(--foreground)]">{insight.title}</h3>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-[var(--muted-foreground)] line-clamp-2">{insight.gap}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="py-6 text-[12.5px] leading-[1.6] text-[var(--muted-foreground)]">
                    Add at least two records with stated limitations to explore research gaps.
                  </p>
                )}
              </div>
            </section>

            <aside className="lg:col-span-4">
              <div className="border border-[var(--border)] bg-[var(--card)] p-5">
                <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)] mb-4">Index</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between items-baseline border-b border-[var(--border)] pb-3">
                    <dt className="text-[12.5px] text-[var(--muted-foreground)]">Papers</dt>
                    <dd className="text-[13px] font-medium font-mono text-[var(--foreground)]">{paperCount}</dd>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-[var(--border)] pb-3">
                    <dt className="text-[12.5px] text-[var(--muted-foreground)]">Experiments</dt>
                    <dd className="text-[13px] font-medium font-mono text-[var(--foreground)]">{experimentCount}</dd>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-[var(--border)] pb-3">
                    <dt className="text-[12.5px] text-[var(--muted-foreground)]">Datasets</dt>
                    <dd className="text-[13px] font-medium font-mono text-[var(--foreground)]">{datasetCount}</dd>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <dt className="text-[12.5px] text-[var(--muted-foreground)]">Research gaps</dt>
                    <dd className="text-[13px] font-medium font-mono text-[var(--foreground)]">{researchGaps.length}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[11px] leading-[1.5] text-[var(--text-tertiary)]">
                  Search indexes titles, topics, variables, and extracted text.
                </p>
              </div>

              <div className="mt-4 border border-[var(--border)] bg-[var(--muted)]/60 p-4">
                <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--muted-foreground)] mb-2">Working note</p>
                <p className="text-[12.5px] leading-[1.6] text-[var(--text-secondary)]">
                  Use Compare to review two studies side-by-side. AI summaries are marked and should be verified against source files.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
