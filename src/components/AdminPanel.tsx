import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, Users, Shield } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { listAllUsersMasked, listTenants, listUsersForTenant } from '../auth/authService';
import { ROLE_LABELS } from '../auth/types';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { session, canManageTenants } = useAuth();
  const [tab, setTab] = useState<'users' | 'tenants'>('users');

  const tenants = useMemo(() => listTenants(), []);
  const users = useMemo(() => {
    if (!session) return [];
    if (canManageTenants) return listAllUsersMasked();
    return listUsersForTenant(session.tenantId).map((u) => ({
      ...u,
      tenantName: session.tenantName,
    }));
  }, [session, canManageTenants]);

  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to workspace
          </button>
          <h1 className="text-3xl font-serif italic text-zinc-900">Access & Tenants</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {canManageTenants
              ? 'Platform view across all tenants and roles.'
              : `Users in ${session.tenantName}.`}
          </p>
        </div>
        <div className="flex rounded-full border border-zinc-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              tab === 'users' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Users
          </button>
          {canManageTenants && (
            <button
              type="button"
              onClick={() => setTab('tenants')}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                tab === 'tenants' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              Tenants
            </button>
          )}
        </div>
      </div>

      {tab === 'users' ? (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
            <Users className="w-3.5 h-3.5" />
            Directory
          </div>
          <div className="divide-y divide-zinc-100">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">
                    <Shield className="w-3 h-3" />
                    {ROLE_LABELS[user.role]}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200">
                    <Building2 className="w-3 h-3" />
                    {'tenantName' in user ? user.tenantName : session.tenantName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {tenants.map((tenant) => {
            const count = listUsersForTenant(tenant.id).length;
            return (
              <div
                key={tenant.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{tenant.name}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-1">{tenant.slug}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <span className="capitalize">{tenant.plan} plan</span>
                  <span>{count} user{count === 1 ? '' : 's'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Demo directory is seeded in-memory. Production should sync from your identity provider and tenant database.
      </p>
    </div>
  );
}
