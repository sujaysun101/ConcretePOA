export type Role = 'user' | 'admin' | 'platform_admin' | 'tester';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
}

export interface UserAccount {
  id: string;
  email: string;
  /** Demo-only plaintext password. Replace with a real IdP in production. */
  password: string;
  name: string;
  role: Role;
  tenantId: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  issuedAt: number;
}

export type LoginResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export const ROLE_LABELS: Record<Role, string> = {
  user: 'User',
  admin: 'Tenant Admin',
  platform_admin: 'Platform Admin',
  tester: 'Tester',
};

export function roleRank(role: Role): number {
  switch (role) {
    case 'platform_admin':
      return 4;
    case 'tester':
      return 3;
    case 'admin':
      return 2;
    case 'user':
    default:
      return 1;
  }
}

export function canAccessAdmin(role: Role): boolean {
  return roleRank(role) >= roleRank('admin');
}

export function canManageTenants(role: Role): boolean {
  return role === 'platform_admin' || role === 'tester';
}

export function canEditBankDatabase(role: Role): boolean {
  return roleRank(role) >= roleRank('admin');
}
