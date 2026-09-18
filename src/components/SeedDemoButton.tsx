"use client";

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';

/** Seed the caller's empty workspace with the demo library. */
export function SeedDemoButton({ className }: { className?: string }) {
  const { refresh, addToast } = useApp();
  const [pending, setPending] = useState(false);

  const handleSeed = async () => {
    setPending(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = (await res.json()) as { seeded?: number; error?: string };
      if (!res.ok) throw new Error(data.error || `Seed failed (${res.status})`);
      await refresh();
      addToast({
        title: 'Demo library loaded',
        description: `${data.seeded ?? 0} sample records. Clearly labeled Demo — remove anytime.`,
      });
    } catch (err) {
      addToast({
        title: 'Could not load demo data',
        description: err instanceof Error ? err.message : 'Seed failed',
        variant: 'destructive',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={pending}
      className={cn(
        'inline-flex h-8 items-center px-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60',
        className
      )}
    >
      {pending ? 'Loading demo…' : 'Load demo library'}
    </button>
  );
}

/** Remove only `demo-*` records from the caller's workspace. */
export function ClearDemoButton({ className }: { className?: string }) {
  const { refresh, addToast } = useApp();
  const [pending, setPending] = useState(false);

  const handleClear = async () => {
    setPending(true);
    try {
      const res = await fetch('/api/seed', { method: 'DELETE' });
      const data = (await res.json()) as { removed?: number; error?: string };
      if (!res.ok) throw new Error(data.error || `Clear failed (${res.status})`);
      await refresh();
      addToast({
        title: 'Demo data cleared',
        description: `${data.removed ?? 0} sample records removed. Your uploads were kept.`,
      });
    } catch (err) {
      addToast({
        title: 'Could not clear demo data',
        description: err instanceof Error ? err.message : 'Clear failed',
        variant: 'destructive',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleClear}
      disabled={pending}
      className={cn(
        'text-[11px] text-[var(--text-tertiary)] hover:text-[var(--foreground)] underline underline-offset-2',
        className
      )}
    >
      {pending ? 'Clearing…' : 'Clear demo data'}
    </button>
  );
}
