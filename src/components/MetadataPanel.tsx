"use client";

import { useState } from 'react';
import type { ResearchRecord } from '@/lib/mock-data';
import { useApp } from '@/lib/context';

interface MetadataPanelProps {
  record: ResearchRecord;
}

function EditableRow({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setEditing(false);
  };

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-0 grid grid-cols-12 gap-3">
      <div className="col-span-12 sm:col-span-4">
        <span className="text-[11px] font-medium tracking-wide text-[var(--muted-foreground)]">{label}</span>
      </div>
      <div className="col-span-12 sm:col-span-8">
        {editing ? (
          <div className="flex gap-2">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              className="flex-1 min-w-0 h-7 px-2 text-[12.5px] border border-[var(--primary)] bg-[var(--card)] focus:outline-none"
            />
            <button onClick={handleSave} className="px-2 h-7 text-[11px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)]">Save</button>
            <button onClick={() => setEditing(false)} className="px-2 h-7 text-[11px] font-medium border border-[var(--border)] bg-[var(--card)]">Cancel</button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <span className="text-[12.5px] leading-[1.5] text-[var(--foreground)] break-words">{value || '—'}</span>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--foreground)] underline underline-offset-2 decoration-[var(--border-strong)]"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MetadataPanel({ record }: MetadataPanelProps) {
  const { updateRecord, addToast } = useApp();

  const handleUpdate = (field: string, value: string) => {
    const updates: Partial<ResearchRecord> = {};
    if (field === 'title') updates.title = value;
    else if (field === 'authors') updates.authors = value.split(',').map(s => s.trim());
    else if (field === 'topics') updates.topics = value.split(',').map(s => s.trim());
    else if (field === 'keywords') updates.keywords = value.split(',').map(s => s.trim());
    else if (field === 'variables') updates.variables = value.split(',').map(s => s.trim());
    else if (field === 'experimentName') updates.experimentName = value;
    else if (field === 'date') updates.date = value;
    updateRecord(record.id, updates);
    addToast({ title: 'Updated', description: `${field} saved.` });
  };

  return (
    <div className="border border-[var(--border)] bg-[var(--card)]">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--muted-foreground)]">Metadata</h3>
        {record.aiProcessed ? (
          <span className="text-[11px] text-[var(--primary)] font-medium">
            AI-indexed{record.aiModel ? ` · ${record.aiModel}` : ''}
          </span>
        ) : record.aiStatus === 'needs-text' ? (
          <span className="text-[11px] text-[#B45309] dark:text-amber-300 font-medium">Needs text — AI skipped</span>
        ) : (
          <span className="text-[11px] text-[var(--text-tertiary)] font-medium">AI unavailable</span>
        )}
      </div>
      <div className="px-4">
        <EditableRow label="Title" value={record.title} onSave={(v) => handleUpdate('title', v)} />
        <EditableRow label="Authors" value={record.authors.join(', ')} onSave={(v) => handleUpdate('authors', v)} />
        <EditableRow label="Date" value={record.date} onSave={(v) => handleUpdate('date', v)} />
        <EditableRow label="Experiment" value={record.experimentName} onSave={(v) => handleUpdate('experimentName', v)} />
        <EditableRow label="Topics" value={record.topics.join(', ')} onSave={(v) => handleUpdate('topics', v)} />
        <EditableRow label="Keywords" value={record.keywords.join(', ')} onSave={(v) => handleUpdate('keywords', v)} />
        <EditableRow label="Variables" value={record.variables.join(', ')} onSave={(v) => handleUpdate('variables', v)} />
        <EditableRow label="File" value={record.fileName} onSave={() => {}} />
      </div>
      {(record.extractionChars ?? 0) > 0 && (
        <div className="px-4 py-2.5 border-t border-[var(--border)]">
          <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {record.extractionChars?.toLocaleString()} chars extracted
            {record.extractionPages ? ` · ${record.extractionPages} pages` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
