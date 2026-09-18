"use client";

import { useApp } from '@/lib/context';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, removeToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 border flex items-start gap-3 ${
            toast.variant === 'destructive' ? 'border-[#FECACA] bg-[#FEF2F2] dark:border-red-900 dark:bg-red-950/40' : 'border-[var(--border)] bg-[var(--card)]'
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium leading-none text-[var(--foreground)]">{toast.title}</p>
            {toast.description && <p className="text-[12px] leading-[1.4] text-[var(--muted-foreground)] mt-1">{toast.description}</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="shrink-0 p-1 text-[var(--text-tertiary)] hover:text-[var(--foreground)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
