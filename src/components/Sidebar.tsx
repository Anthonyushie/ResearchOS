"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FlaskConical, Database, Lightbulb, GitCompareArrows, X, LogOut } from 'lucide-react';
import { useApp } from '@/lib/context';
import { signOut, useSession } from 'next-auth/react';
import { LogoMark } from '@/components/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/research', label: 'Research', icon: FlaskConical },
  { href: '/datasets', label: 'Datasets', icon: Database },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, records } = useApp();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? 'My Library';
  const userEmail = session?.user?.email ?? '';
  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-[224px] h-screen bg-[var(--card)] border-r border-[var(--border)] flex flex-col shrink-0 transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mark */}
        <div className="h-[56px] flex items-center justify-between px-5 border-b border-[var(--border)] shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[13.5px] font-semibold tracking-[-0.02em] text-[var(--foreground)]">ResearchOS</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <div className="mb-6 px-2">
            <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Workspace</p>
          </div>

          <div className="space-y-[1px]">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-[10px] px-2.5 py-[7px] text-[13px] leading-none tracking-[-0.01em] transition-colors relative",
                    isActive
                      ? "text-[var(--foreground)] font-[550]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-[450]"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-[6px] bottom-[6px] w-[2px] bg-[var(--primary)] rounded-full" />
                  )}
                  <item.icon className={cn("h-[14px] w-[14px] shrink-0", isActive ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]")} strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 mx-2 h-px bg-[var(--border)]" />

          <div className="mt-6 px-2">
            <p className="text-[11px] leading-[1.5] text-[var(--muted-foreground)]">
              {userName}&apos;s workspace<br />
              <span className="text-[var(--text-tertiary)]">{records.length} records · private</span>
            </p>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={userName}
                className="w-6 h-6 rounded-full border border-[var(--border)] object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center">
                <span className="text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)]">{initials}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium leading-none text-[var(--foreground)] truncate">{userName}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">{userEmail || 'Private workspace'}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--foreground)]"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
