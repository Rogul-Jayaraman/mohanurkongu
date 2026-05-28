import api from '../lib/api';

export async function fetchAdminAccounts(params: { page: number; search?: string }): Promise<{ accounts: any[]; meta: any }> {
  const raw: any = await api.get('/admin/accounts', { params });
  const accounts = (raw.accounts || []).map((a: any) => ({
    id: a.id,
    customId: a.accountNo ?? a.id,
    firstNameEn: a.firstNameEn ?? '',
    lastNameEn: a.lastNameEn ?? '',
    firstNameTa: a.firstNameTa,
    lastNameTa: a.lastNameTa,
    email: a.email ?? '',
    phone: a.phone ?? '',
    role: a.role ?? 'USER',
    plan: 'BASIC',
    planExpiry: null,
    createdAt: a.createdAt,
    updatedAt: a.createdAt,
    profileCount: a.profileCount ?? 0,
    joinedDate: a.createdAt,
    accountStatus: a.currentState ?? 'ACTIVE',
  }));
  return { accounts, meta: raw.meta };
}

export function suspendAccount(id: string, reasonEn: string, reasonTa?: string): Promise<any> {
  return api.post(`/admin/accounts/${id}/suspend`, { reasonEn, reasonTa });
}

export function revokeAccount(id: string): Promise<any> {
  return api.post(`/admin/accounts/${id}/restore`);
}
