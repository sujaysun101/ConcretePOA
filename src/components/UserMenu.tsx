import React, { useEffect, useRef, useState } from 'react';
import { LogOut, ChevronDown, Shield, Building2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../auth/types';
import { cn } from '../lib/utils';

interface UserMenuProps {
  onOpenAdmin?: () => void;
}

export function UserMenu({ onOpenAdmin }: UserMenuProps) {
  const { session, logout, canAccessAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!session) return null;

  const initials = session.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors',
          open && 'ring-2 ring-zinc-900/5'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center">
          {initials}
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <p className="text-xs font-semibold text-zinc-900">{session.name}</p>
          <p className="text-[10px] text-zinc-500">{ROLE_LABELS[session.role]}</p>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 z-[60] overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
            <p className="text-sm font-semibold text-zinc-900">{session.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{session.email}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-900 text-white">
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[session.role]}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-100 text-zinc-600">
                <Building2 className="w-3 h-3" />
                {session.tenantName}
              </span>
            </div>
          </div>
          <div className="p-2">
            {canAccessAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenAdmin();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Tenant & access admin
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
