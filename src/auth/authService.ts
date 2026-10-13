import { DEMO_CREDENTIALS, TENANTS, USERS } from './seed';
import type { AuthSession, LoginResult, Role, Tenant, UserAccount } from './types';

const SESSION_KEY = 'concrete_poa_auth_session';
const REGISTRY_KEY = 'concrete_poa_auth_registry';

interface AuthRegistry {
  tenants: Tenant[];
  users: UserAccount[];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readRegistry(): AuthRegistry {
  const raw = localStorage.getItem(REGISTRY_KEY);
  if (!raw) {
    return { tenants: [], users: [] };
  }
  try {
    const parsed = JSON.parse(raw) as AuthRegistry;
    return {
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
    };
  } catch {
    return { tenants: [], users: [] };
  }
}

function writeRegistry(registry: AuthRegistry): void {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

function allTenants(): Tenant[] {
  const registry = readRegistry();
  const byId = new Map<string, Tenant>();
  for (const t of TENANTS) byId.set(t.id, t);
  for (const t of registry.tenants) byId.set(t.id, t);
  return [...byId.values()];
}

function allUsers(): UserAccount[] {
  const registry = readRegistry();
  const byId = new Map<string, UserAccount>();
  for (const u of USERS) byId.set(u.id, u);
  for (const u of registry.users) byId.set(u.id, u);
  return [...byId.values()];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'workspace';
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'User';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function persistSession(user: UserAccount, tenant: Tenant): AuthSession {
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
  return session;
}

export function getTenantById(tenantId: string): Tenant | undefined {
  return allTenants().find((t) => t.id === tenantId);
}

export function listTenants(): Tenant[] {
  return allTenants();
}

export function listUsersForTenant(tenantId: string): UserAccount[] {
  return allUsers()
    .filter((u) => u.tenantId === tenantId)
    .map((u) => ({ ...u, password: '••••••••' }));
}

export function listAllUsersMasked(): Array<UserAccount & { tenantName: string }> {
  return allUsers().map((u) => ({
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

  const user = allUsers().find((u) => normalizeEmail(u.email) === normalized);
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const tenant = getTenantById(user.tenantId);
  if (!tenant) {
    return { ok: false, error: 'Your account is not linked to a valid tenant.' };
  }

  return { ok: true, session: persistSession(user, tenant) };
}

export function register(input: {
  email: string;
  password: string;
  confirmPassword: string;
  tenantName?: string;
}): LoginResult {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!email || !password || !confirmPassword) {
    return { ok: false, error: 'Fill in email, password, and confirm password.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Passwords do not match.' };
  }
  if (allUsers().some((u) => normalizeEmail(u.email) === email)) {
    return { ok: false, error: 'An account with this email already exists. Sign in instead.' };
  }

  const registry = readRegistry();
  const displayName = nameFromEmail(email);
  const orgName = (input.tenantName || `${displayName}'s Workspace`).trim();
  const tenantId = `tenant-${slugify(orgName)}-${Date.now().toString(36)}`;
  const tenant: Tenant = {
    id: tenantId,
    name: orgName,
    slug: slugify(orgName),
    plan: 'starter',
  };
  const user: UserAccount = {
    id: `user-${Date.now().toString(36)}`,
    email,
    password,
    name: displayName,
    // First account in a new tenant is the tenant admin
    role: 'admin',
    tenantId,
  };

  registry.tenants.push(tenant);
  registry.users.push(user);
  writeRegistry(registry);

  return { ok: true, session: persistSession(user, tenant) };
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
    const user = allUsers().find((u) => u.id === session.userId);
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
