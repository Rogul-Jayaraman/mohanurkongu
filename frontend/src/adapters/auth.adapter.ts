import type { BackendAccount } from '../api/auth.api';
import type { User, Admin } from '../types/user';

export function mapAccountToUser(account: BackendAccount): User {
  return {
    id: account.id,
    customId: account.accountNo,
    firstNameEn: account.firstNameEn,
    lastNameEn: account.lastNameEn,
    firstNameTa: account.firstNameTa || null,
    lastNameTa: account.lastNameTa || null,
    email: account.email,
    phone: account.phone || '',
    role: account.roles.includes('ADMIN') ? 'ADMIN' : 'USER',
    plan: account.membership?.planCode === 'PREMIUM' ? 'PREMIUM' : 'BASIC',
    planExpiry: account.membership?.expiresAt || null,
    createdAt: account.createdAt,
    updatedAt: account.createdAt,
  };
}

export function mapAccountToAdmin(account: BackendAccount): Admin {
  return {
    id: account.id,
    firstNameEn: account.firstNameEn,
    lastNameEn: account.lastNameEn,
    firstNameTa: account.firstNameTa || null,
    lastNameTa: account.lastNameTa || null,
    email: account.email,
    phone: account.phone || '',
    role: 'ADMIN',
    createdAt: account.createdAt,
  };
}

export function storeSession(_accessToken: string, account: BackendAccount) {
  const isAdmin = account.roles.includes('ADMIN');
  return isAdmin ? mapAccountToAdmin(account) : mapAccountToUser(account);
}

export function clearSession() {
  // No-op — session is memory-only, managed by useAuth + session.ts
}
