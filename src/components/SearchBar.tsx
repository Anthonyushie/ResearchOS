"use client";

import { Search, ArrowRight } from 'lucide-react';
import { useState, useCallback } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onChange(localValue);
  }, [localValue, onChange]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-[15px] w-[15px] text-[var(--text-tertiary)] pointer-events-none" strokeWidth={1.75} />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[42px] pl-[38px] pr-[96px] bg-[var(--card)] border border-[var(--border)] text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-[1.5px] focus:ring-[var(--primary)]/10 transition-all"
        />
        <button
          type="submit"
          className="absolute right-[5px] top-[5px] bottom-[5px] inline-flex items-center gap-1.5 px-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] text-[12.5px] font-medium hover:opacity-90 transition-opacity"
        >
          Search <ArrowRight className="h-3 w-3 hidden sm:block" strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
