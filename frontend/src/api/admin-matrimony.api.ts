import api from '../lib/api';
import { ApiResponse } from './profiles.api';

export interface AdminAccount {
    id: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameTa: string;
    lastNameTa: string;
    customId: string;
    email: string;
    phone: string;
    plan: string;
    planExpiry: string | null;
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

export const adminMatrimonyApi = {
    // Accounts
    listAccounts: async (params: any = {}): Promise<ApiResponse<AdminAccount[]>> => {
        return api.get('/admin/matrimony/accounts', { params });
    },

    suspendAccount: async (id: string, data: { reasonEn: string; reasonTa: string }): Promise<ApiResponse<any>> => {
        return api.patch(`/admin/matrimony/accounts/${id}/suspend`, data);
    },

    revokeSuspension: async (id: string): Promise<ApiResponse<any>> => {
        return api.patch(`/admin/matrimony/accounts/${id}/revoke-suspension`);
    },

    // TODO: Re-implement upgradePlan, cancelPlan, getPlanHistory with new plan system

    // Profiles
    listProfiles: async (params: any = {}): Promise<ApiResponse<AdminManagedProfile[]>> => {
        return api.get('/admin/matrimony/profiles', { params });
    },

    verificationList: async (params: any = {}): Promise<ApiResponse<AdminManagedProfile[]>> => {
        return api.get('/admin/matrimony/verification', { params });
    },

    detail: async (id: string): Promise<ApiResponse<any>> => {
        return api.get(`/admin/matrimony/profiles/${id}`);
    },

    verify: async (id: string, data: { status: string; reasonEn?: string; reasonTa?: string }): Promise<ApiResponse<any>> => {
        return api.patch(`/admin/matrimony/profiles/${id}/verify`, data);
    },

    block: async (id: string, data: { reasonEn: string; reasonTa: string }): Promise<ApiResponse<any>> => {
        return api.patch(`/admin/matrimony/profiles/${id}/block`, data);
    },
    
    updateStatus: async (id: string, status: string): Promise<ApiResponse<any>> => {
        return api.patch(`/admin/matrimony/profiles/${id}/status`, { status });
    },

    // Dashboard & Settings
    getStats: async (): Promise<ApiResponse<any>> => {
        return api.get('/admin/matrimony/stats');
    },

    // TODO: Re-implement getPremiumPrice, updatePremiumPrice with new plan system
};
