"use client";

import { Upload, Menu, Sun, Moon } from 'lucide-react';
import { useApp } from '@/lib/context';

export function Header() {
  const { setUploadModalOpen, setSidebarOpen, theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <header className="h-[56px] bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 -ml-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          aria-label="Open navigation"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-[12.5px]">
          <span className="text-[var(--text-tertiary)]">Workspace</span>
          <span className="text-[var(--border-strong)]">/</span>
          <span className="text-[var(--foreground)] font-[500]">Agricultural Sciences Lab</span>
        </div>

        <div className="lg:hidden min-w-0">
          <p className="text-[13px] font-medium leading-none text-[var(--foreground)] truncate">Agricultural Sciences Lab</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-[500] tracking-[-0.01em] hover:opacity-90 transition-opacity"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Add research</span>
        </button>
      </div>
    </header>
  );
}
