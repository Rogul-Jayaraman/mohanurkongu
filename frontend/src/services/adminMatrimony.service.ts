import api from '@/lib/api';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminAccount {
  id: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  customId: string;
  email: string;
  phone: string;
  profileCount: number;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  joinedDate: string;
}

export interface AdminManagedProfile {
  id: string;
  regNo: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  firstNameTa: string | null;
  lastNameTa: string | null;
  owner: {
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string;
    lastNameTa: string;
    id: string;
    phone: string;
  };
  kulam: string;
  kuladeivamEn: string | null;
  kuladeivamTa: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  adminVerified: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  photo: string | null;
  createdAt: string;
}

export const getAccounts = async (params: { page: number; limit: number; search?: string }) => {
  const response = await api.get<PaginatedResponse<AdminAccount>>('/admin/matrimony/accounts', { params });
  return response.data;
};

export const suspendAccount = async (id: string, reasonEn: string, reasonTa: string) => {
  const response = await api.patch(`/admin/matrimony/accounts/${id}/suspend`, { reasonEn, reasonTa });
  return response.data;
};

export const revokeSuspension = async (id: string) => {
  const response = await api.patch(`/admin/matrimony/accounts/${id}/revoke-suspension`);
  return response.data;
};

export const getProfiles = async (params: { page: number; limit: number; search?: string; status?: string; verified?: string }) => {
  const response = await api.get<PaginatedResponse<AdminManagedProfile>>('/admin/matrimony/profiles', { params });
  return response.data;
};

export const getVerificationProfiles = async (params: { page: number; limit: number; search?: string }) => {
  const response = await api.get<PaginatedResponse<AdminManagedProfile>>('/admin/matrimony/verification', { params });
  return response.data;
};

export const verifyProfile = async (id: string, data: { status: string; reasonEn?: string; reasonTa?: string }) => {
  const response = await api.patch(`/admin/matrimony/profiles/${id}/verify`, data);
  return response.data;
};

export const blockProfile = async (id: string, reasonEn: string, reasonTa: string) => {
  const response = await api.patch(`/admin/matrimony/profiles/${id}/block`, { reasonEn, reasonTa });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/admin/matrimony/stats');
  return response.data;
};

export const getProfileById = async (id: string) => {
  const response = await api.get<any>(`/admin/matrimony/profiles/${id}`);
  return response.data;
};

// TODO: Re-implement getPremiumPrice, updatePremiumPrice, getUserPlanHistory with new plan system
