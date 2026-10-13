import { DEMO_CREDENTIALS, TENANTS, USERS } from './seed';
import type { AuthSession, LoginResult, Role, Tenant, UserAccount } from './types';

const SESSION_KEY = 'concrete_poa_auth_session';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getTenantById(tenantId: string): Tenant | undefined {
  return TENANTS.find((t) => t.id === tenantId);
}

export function listTenants(): Tenant[] {
  return [...TENANTS];
}

export function listUsersForTenant(tenantId: string): UserAccount[] {
  return USERS.filter((u) => u.tenantId === tenantId).map((u) => ({
    ...u,
    password: '••••••••',
  }));
}

export function listAllUsersMasked(): Array<UserAccount & { tenantName: string }> {
  return USERS.map((u) => ({
    ...u,
    password: '••••••••',
    tenantName: getTenantById(u.tenantId)?.name ?? 'Unknown',
  }));
}

export function login(email: string, password: string): LoginResult {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) {
    return { ok: false, error: 'Enter both email and password.' };
  }

  const user = USERS.find((u) => normalizeEmail(u.email) === normalized);
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const tenant = getTenantById(user.tenantId);
  if (!tenant) {
    return { ok: false, error: 'Your account is not linked to a valid tenant.' };
  }

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    issuedAt: Date.now(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function readSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.userId || !session?.email || !session?.role || !session?.tenantId) {
      return null;
    }
    // Re-validate that the seeded account still exists
    const user = USERS.find((u) => u.id === session.userId);
    const tenant = getTenantById(session.tenantId);
    if (!user || !tenant) {
      logout();
      return null;
    }
    return {
      ...session,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    };
  } catch {
    logout();
    return null;
  }
}

export function getDemoCredentials() {
  return DEMO_CREDENTIALS;
}
