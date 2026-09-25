"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ResearchRecord } from '@/lib/mock-data';

const typeColor: Record<ResearchRecord['type'], string> = {
  paper: '#4F8E78',
  experiment: '#5A7BA5',
  dataset: '#AE8454',
};

function shortLabel(label: string, max: number): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function EvidenceMap({ records }: { records: ResearchRecord[] }) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const graph = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const record of records) {
      for (const topic of record.topics) {
        const key = topic.trim().toLowerCase();
        if (!key) continue;
        const item = counts.get(key);
        counts.set(key, { label: item?.label ?? topic.trim(), count: (item?.count ?? 0) + 1 });
      }
    }
    const topics = [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
      .slice(0, 8)
      .map(([key, value]) => ({ key, ...value }));
    const topicKeys = new Set(topics.map(topic => topic.key));
    const relatedRecords = records
      .filter(record => record.topics.some(topic => topicKeys.has(topic.trim().toLowerCase())))
      .slice(0, 10);
    return { topics, relatedRecords };
  }, [records]);

  if (!graph.topics.length) {
    return <p className="py-8 text-[12.5px] text-[var(--muted-foreground)]">No topic connections yet. Upload research with extracted topics to build the map.</p>;
  }

  const selected = selectedTopic && graph.topics.some(topic => topic.key === selectedTopic) ? selectedTopic : null;
  const linkedRecords = selected
    ? records.filter(record => record.topics.some(topic => topic.trim().toLowerCase() === selected))
    : [];
  const height = Math.max(graph.topics.length * 60, graph.relatedRecords.length * 72) + 24;
  const topicY = (index: number) => 18 + index * 60;
  const recordY = (index: number) => 18 + index * 72;

  return (
    <div>
      <p className="text-[12px] leading-[1.6] text-[var(--muted-foreground)] mb-4">Choose a topic to trace it to the papers, experiments, and datasets in your library. Lines show shared topic tags.</p>
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--card)]">
        <svg viewBox={`0 0 900 ${height}`} className="block min-w-[760px] w-full" role="img" aria-label="Evidence map connecting research topics to records">
          <text x="20" y="14" fill="var(--text-tertiary)" fontSize="10" fontWeight="600" letterSpacing="1">TOPICS</text>
          <text x="500" y="14" fill="var(--text-tertiary)" fontSize="10" fontWeight="600" letterSpacing="1">RESEARCH RECORDS</text>
          {graph.topics.flatMap((topic, topicIndex) => graph.relatedRecords.flatMap((record, recordIndex) => {
            if (!record.topics.some(value => value.trim().toLowerCase() === topic.key)) return [];
            const active = selected === null || selected === topic.key;
            return [<path
              key={`${topic.key}-${record.id}`}
              d={`M 252 ${topicY(topicIndex) + 23} C 350 ${topicY(topicIndex) + 23}, 400 ${recordY(recordIndex) + 25}, 500 ${recordY(recordIndex) + 25}`}
              fill="none"
              stroke={selected === topic.key ? 'var(--primary)' : 'var(--border-strong)'}
              strokeWidth={selected === topic.key ? 2 : 1.2}
              opacity={active ? 0.85 : 0.12}
            />];
          }))}
          {graph.topics.map((topic, index) => {
            const active = selected === topic.key;
            return <g
              key={topic.key}
              role="button"
              tabIndex={0}
              aria-label={`Show ${topic.label} connections`}
              onClick={() => setSelectedTopic(active ? null : topic.key)}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTopic(active ? null : topic.key); } }}
              className="cursor-pointer focus:outline-none"
            >
              <rect x="20" y={topicY(index)} width="232" height="46" rx="5" fill={active ? 'var(--accent)' : 'var(--surface-hover)'} stroke={active ? 'var(--primary)' : 'var(--border)'} />
              <text x="33" y={topicY(index) + 20} fill="var(--foreground)" fontSize="12" fontWeight="600">{shortLabel(topic.label, 26)}</text>
              <text x="33" y={topicY(index) + 36} fill="var(--muted-foreground)" fontSize="10">{topic.count} {topic.count === 1 ? 'record' : 'records'}</text>
              <title>{topic.label}: {topic.count} connected records</title>
            </g>;
          })}
          {graph.relatedRecords.map((record, index) => {
            const active = !selected || record.topics.some(topic => topic.trim().toLowerCase() === selected);
            return <a key={record.id} href={`/research/${encodeURIComponent(record.id)}`} aria-label={`Open ${record.title}`} style={{ opacity: active ? 1 : 0.32 }}>
              <rect x="500" y={recordY(index)} width="374" height="50" rx="5" fill="var(--card)" stroke="var(--border)" />
              <rect x="500" y={recordY(index)} width="4" height="50" rx="2" fill={typeColor[record.type]} />
              <text x="515" y={recordY(index) + 20} fill="var(--foreground)" fontSize="12" fontWeight="600">{shortLabel(record.title, 45)}</text>
              <text x="515" y={recordY(index) + 37} fill="var(--muted-foreground)" fontSize="10">{record.type}{record.aiStatus === 'demo' ? ' · demo data' : ''}</text>
              <title>{record.title}</title>
            </a>;
          })}
        </svg>
      </div>
      {selected && (
        <div className="mt-4 border border-[var(--border)] bg-[var(--surface-hover)]/50 p-4">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h3 className="text-[13px] font-semibold text-[var(--foreground)]">{graph.topics.find(topic => topic.key === selected)?.label}</h3>
            <span className="text-[11px] text-[var(--muted-foreground)]">{linkedRecords.length} linked records</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {linkedRecords.map(record => <div key={record.id} className="py-2.5">
              <Link href={`/research/${record.id}`} className="text-[12.5px] font-medium text-[var(--primary)] hover:underline">{record.title} →</Link>
              <p className="mt-1 text-[11.5px] leading-[1.5] text-[var(--muted-foreground)] line-clamp-2">{record.description || record.summary.objective || 'No description available.'}</p>
            </div>)}
          </div>
        </div>
      )}
      {graph.relatedRecords.length < records.length && <p className="mt-3 text-[11px] text-[var(--text-tertiary)]">Showing the most common 8 topics and up to 10 connected records.</p>}
    </div>
  );
}
