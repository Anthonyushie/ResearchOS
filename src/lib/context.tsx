"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ResearchRecord } from './mock-data';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface AppContextType {
  records: ResearchRecord[];
  loading: boolean;
  backend: 'db' | 'mock';
  refresh: () => Promise<void>;
  addRecord: (record: ResearchRecord) => void;
  updateRecord: (id: string, updates: Partial<ResearchRecord>) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  uploadModalOpen: boolean;
  setUploadModalOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backend, setBackend] = useState<'db' | 'mock'>('mock');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  const setTheme = useCallback((next: 'light' | 'dark') => {
    setThemeState(next);
    try {
      localStorage.setItem('researchos-theme', next);
    } catch {
      // storage unavailable (private mode) — theme just won't persist
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Initialise theme from storage / OS preference (blocking script in
  // layout.tsx already set the class pre-paint to avoid a flash).
  useEffect(() => {
    try {
      const stored = localStorage.getItem('researchos-theme');
      if (stored === 'light' || stored === 'dark') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
        document.documentElement.classList.toggle('dark', stored === 'dark');
        document.documentElement.style.colorScheme = stored;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      }
    } catch {
      // ignore — light theme default stands
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/research?limit=100', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { records: ResearchRecord[]; source: string };
      setRecords(Array.isArray(data.records) ? data.records : []);
      setBackend(data.source === 'db' ? 'db' : 'mock');
    } catch (err) {
      console.warn('[context] backend fetch failed:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial library load from backend (falls back to bundled mock data)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const addRecord = useCallback((record: ResearchRecord) => {
    setRecords(prev => [record, ...prev]);
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<ResearchRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      records, loading, backend, refresh, addRecord, updateRecord,
      toasts, addToast, removeToast,
      uploadModalOpen, setUploadModalOpen,
      sidebarOpen, setSidebarOpen,
      theme, setTheme, toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
