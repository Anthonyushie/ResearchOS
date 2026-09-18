"use client";

import { useState, useCallback, useRef } from 'react';
import { X, FileText, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { useApp } from '@/lib/context';
import type { ResearchRecord } from '@/lib/mock-data';

interface EditableMetadata {
  title: string;
  topics: string[];
  keywords: string[];
  authors: string[];
  date: string;
  experimentName: string;
  variables: string[];
  type?: string;
  description?: string;
}

type UploadStage = 'select' | 'uploading' | 'processing' | 'complete' | 'error';

export function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen, addRecord, refresh, addToast } = useApp();
  const [stage, setStage] = useState<UploadStage>('select');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<EditableMetadata | null>(null);
  const [aiUsed, setAiUsed] = useState(false);
  const [needsText, setNeedsText] = useState(false);
  const [error, setError] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStage('select');
    setFileName('');
    setSelectedFile(null);
    setMetadata(null);
    setNeedsText(false);
    setError('');
    setEditingField(null);
  }, []);

  const handleClose = useCallback(() => {
    setUploadModalOpen(false);
    setTimeout(reset, 300);
  }, [setUploadModalOpen, reset]);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setSelectedFile(file);
    setError('');
    setStage('uploading');
    try {
      // Upload + Gemini analysis on the server. Server returns editable metadata
      // via the created record; we map it back into the editable form.
      const form = new FormData();
      form.append('file', file);
      setStage('processing');
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      const rec = data.record as ResearchRecord;
      setAiUsed(Boolean(data.aiUsed));
      setNeedsText(data.aiStatus === 'needs-text');
      setMetadata({
        title: rec.title,
        topics: rec.topics,
        keywords: rec.keywords,
        authors: rec.authors,
        date: rec.date,
        experimentName: rec.experimentName,
        variables: rec.variables,
        type: rec.type,
        description: rec.description,
      });
      // Keep the server record id so confirm just patches instead of duplicating
      (rec as ResearchRecord & { _serverId?: string })._serverId = rec.id;
      setSelectedFile(Object.assign(file, { _serverId: rec.id }) as File);
      setStage('complete');
      // Optimistically add; confirm step will PATCH edits
      addRecord(rec);
      void refresh();
    } catch (err) {
      console.error('[upload] failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStage('error');
    }
  }, [addRecord, refresh]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }, [processFile]);

  const handleConfirmEdits = useCallback(async () => {
    if (!metadata) return;
    try {
      const serverId = (selectedFile as File & { _serverId?: string } | null)?._serverId;
      if (serverId) {
        // PATCH edited metadata onto the already-saved server record
        await fetch(`/api/research/${serverId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: metadata.title,
            topics: metadata.topics,
            keywords: metadata.keywords,
            authors: metadata.authors,
            date: metadata.date,
            experimentName: metadata.experimentName,
            variables: metadata.variables,
          }),
        });
        await refresh();
      }
      addToast({
        title: needsText
          ? 'Added without AI — text unreadable'
          : aiUsed
            ? 'Added with Gemini AI'
            : 'Added to library',
        description: needsText
          ? `"${metadata.title}" saved as an attachment. Fill in details manually.`
          : `"${metadata.title}" indexed.`,
      });
    } catch (err) {
      console.error('[upload] confirm failed:', err);
      addToast({ title: 'Saved locally', description: `"${metadata.title}" kept in this session.` });
    }
    handleClose();
  }, [metadata, selectedFile, aiUsed, needsText, refresh, addToast, handleClose]);

  if (!uploadModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/60" onClick={handleClose} />
      <div className="relative bg-[var(--card)] border border-[var(--border)] w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
          <div>
            <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--foreground)]">Add research</h2>
            <p className="text-[11.5px] text-[var(--muted-foreground)] mt-0.5">PDF, CSV, TXT, or images · indexed for search</p>
          </div>
          <button onClick={handleClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--foreground)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {stage === 'select' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[var(--border-strong)] bg-[var(--surface-hover)]/50 py-10 px-6 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--accent)]/50 transition-colors"
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.csv,.txt,.png,.jpg,.jpeg" onChange={handleFileSelect} className="hidden" />
              <FileText className="h-6 w-6 text-[var(--text-tertiary)] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[13px] font-medium text-[var(--foreground)]">Drop file or click to browse</p>
              <p className="text-[11.5px] text-[var(--muted-foreground)] mt-1">Maximum 50 MB</p>
            </div>
          )}

          {stage === 'uploading' && (
            <div className="py-10 text-center">
              <Loader2 className="h-5 w-5 text-[var(--primary)] mx-auto mb-3 animate-spin" />
              <p className="text-[13px] font-medium text-[var(--foreground)]">Uploading</p>
              <p className="text-[11.5px] font-mono text-[var(--muted-foreground)] mt-1">{fileName}</p>
            </div>
          )}

          {stage === 'processing' && (
            <div className="py-10 text-center">
              <Loader2 className="h-5 w-5 text-[var(--primary)] mx-auto mb-3 animate-spin" />
              <p className="text-[13px] font-medium text-[var(--foreground)]">Indexing</p>
              <p className="text-[11.5px] text-[var(--muted-foreground)] mt-1">Extracting text · detecting topics · generating summary</p>
            </div>
          )}

          {stage === 'error' && (
            <div className="py-10 text-center">
              <p className="text-[13px] font-medium text-[#991B1B] dark:text-red-300">Upload failed</p>
              <p className="text-[12px] text-[var(--muted-foreground)] mt-1 max-w-[40ch] mx-auto">{error}</p>
              <div className="flex gap-2 mt-4 max-w-[280px] mx-auto">
                <button onClick={() => setStage('select')} className="flex-1 h-8 border border-[var(--border)] bg-[var(--card)] text-[12.5px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
                  Try again
                </button>
                <button onClick={handleClose} className="flex-1 h-8 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-medium hover:opacity-90">
                  Close
                </button>
              </div>
            </div>
          )}

          {stage === 'complete' && metadata && (
            <div className="space-y-4">
              {needsText ? (
                <div className="flex items-start gap-2 border border-[#FDE68A] bg-[#FFFBEB] dark:border-amber-900 dark:bg-amber-950/40 px-3 py-2.5">
                  <div>
                    <p className="text-[12.5px] font-medium text-[#92400E] dark:text-amber-200">Saved without AI analysis</p>
                    <p className="text-[11.5px] leading-[1.5] text-[#B45309] dark:text-amber-300/90 mt-0.5">
                      No readable text found (scanned PDF or image?). Fields below are blank — fill in what you know manually.
                    </p>
                    <p className="text-[11px] font-mono text-[#B45309] dark:text-amber-400 mt-1">{fileName}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 border border-[#D1FAE5] bg-[#ECFDF5] dark:border-emerald-900 dark:bg-emerald-950/40 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#065F46] dark:text-emerald-300 shrink-0" />
                  <div>
                    <p className="text-[12.5px] font-medium text-[#065F46] dark:text-emerald-300">Indexed</p>
                    <p className="text-[11px] font-mono text-[#047857] dark:text-emerald-400">{fileName}</p>
                  </div>
                </div>
              )}

              <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--primary)]">Extracted metadata · editable</p>

              <div className="border border-[var(--border)] divide-y divide-[var(--border)]">
                {[
                  { label: 'Title', value: metadata.title, key: 'title' },
                  { label: 'Topics', value: metadata.topics.join(', '), key: 'topics' },
                  { label: 'Keywords', value: metadata.keywords.join(', '), key: 'keywords' },
                  { label: 'Authors', value: metadata.authors.join(', '), key: 'authors' },
                  { label: 'Date', value: metadata.date, key: 'date' },
                  { label: 'Experiment', value: metadata.experimentName, key: 'experimentName' },
                  { label: 'Variables', value: metadata.variables.join(', '), key: 'variables' },
                ].map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-2 px-3 py-2.5">
                    <span className="col-span-3 text-[11px] font-medium text-[var(--muted-foreground)]">{field.label}</span>
                    <div className="col-span-9 flex items-start justify-between gap-2">
                      {editingField === field.key ? (
                        <input
                          defaultValue={field.value}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (field.key === 'title') metadata.title = val;
                            else if (field.key === 'topics') metadata.topics = val.split(',').map(s => s.trim());
                            else if (field.key === 'keywords') metadata.keywords = val.split(',').map(s => s.trim());
                            else if (field.key === 'authors') metadata.authors = val.split(',').map(s => s.trim());
                            else if (field.key === 'date') metadata.date = val;
                            else if (field.key === 'experimentName') metadata.experimentName = val;
                            else if (field.key === 'variables') metadata.variables = val.split(',').map(s => s.trim());
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          autoFocus
                          className="flex-1 min-w-0 text-[12.5px] border border-[var(--primary)] px-2 py-1 focus:outline-none"
                        />
                      ) : (
                        <span className="text-[12.5px] leading-[1.4] text-[var(--foreground)] break-words">{field.value}</span>
                      )}
                      <button
                        onClick={() => setEditingField(editingField === field.key ? null : field.key)}
                        className="shrink-0 p-1 text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleClose} className="flex-1 h-8 border border-[var(--border)] bg-[var(--card)] text-[12.5px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
                  Close
                </button>
                <button onClick={handleConfirmEdits} className="flex-1 h-8 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-medium hover:opacity-90">
                  Done{needsText ? '' : aiUsed ? ' · AI-indexed' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
