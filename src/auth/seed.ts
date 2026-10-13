import type { Tenant, UserAccount } from './types';

export const TENANTS: Tenant[] = [
  {
    id: 'tenant-platform',
    name: 'ConcretePOA Platform',
    slug: 'platform',
    plan: 'enterprise',
  },
  {
    id: 'tenant-acme',
    name: 'Acme Legal Group',
    slug: 'acme-legal',
    plan: 'professional',
  },
  {
    id: 'tenant-harbor',
    name: 'Harbor Trust Advisors',
    slug: 'harbor-trust',
    plan: 'starter',
  },
];

export const USERS: UserAccount[] = [
  {
    id: 'user-platform-admin',
    email: 'admin@concretepoa.com',
    password: 'Admin123!',
    name: 'Alex Rivera',
    role: 'platform_admin',
    tenantId: 'tenant-platform',
  },
  {
    id: 'user-tester',
    email: 'tester@concretepoa.com',
    password: 'Tester123!',
    name: 'Taylor Quinn',
    role: 'tester',
    tenantId: 'tenant-platform',
  },
  {
    id: 'user-acme-admin',
    email: 'admin@acmelegal.com',
    password: 'AcmeAdmin1!',
    name: 'Jordan Hale',
    role: 'admin',
    tenantId: 'tenant-acme',
  },
  {
    id: 'user-acme-user',
    email: 'user@acmelegal.com',
    password: 'User123!',
    name: 'Sam Ortiz',
    role: 'user',
    tenantId: 'tenant-acme',
  },
  {
    id: 'user-harbor-user',
    email: 'user@harbortrust.com',
    password: 'Harbor123!',
    name: 'Casey Bloom',
    role: 'user',
    tenantId: 'tenant-harbor',
  },
];

export interface DemoCredential {
  label: string;
  email: string;
  password: string;
  role: string;
  tenant: string;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    label: 'Platform Admin',
    email: 'admin@concretepoa.com',
    password: 'Admin123!',
    role: 'Platform Admin',
    tenant: 'ConcretePOA Platform',
  },
  {
    label: 'Tester',
    email: 'tester@concretepoa.com',
    password: 'Tester123!',
    role: 'Tester',
    tenant: 'ConcretePOA Platform',
  },
  {
    label: 'Tenant Admin',
    email: 'admin@acmelegal.com',
    password: 'AcmeAdmin1!',
    role: 'Tenant Admin',
    tenant: 'Acme Legal Group',
  },
  {
    label: 'Standard User',
    email: 'user@acmelegal.com',
    password: 'User123!',
    role: 'User',
    tenant: 'Acme Legal Group',
  },
  {
    label: 'Other Tenant User',
    email: 'user@harbortrust.com',
    password: 'Harbor123!',
    role: 'User',
    tenant: 'Harbor Trust Advisors',
  },
];
