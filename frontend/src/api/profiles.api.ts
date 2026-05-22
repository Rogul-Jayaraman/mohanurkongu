import api from '../lib/api';
import { Profile } from '../types';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
    error?: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string>;
    };
}

export const profilesApi = {
    /**
     * Get a list of profiles (Public/Authenticated)
     */
    list: async (params: any = {}): Promise<ApiResponse<Profile[]>> => {
        return api.get('/profiles', { params });
    },

    /**
     * Get profiles owned by the current user
     */
    myProfiles: async (): Promise<ApiResponse<Profile[]>> => {
        return api.get('/profiles/my');
    },

    /**
     * Get a single profile by ID
     */
    detail: async (id: string): Promise<ApiResponse<Profile>> => {
        return api.get(`/profiles/${id}`);
    },

    // ─── Draft APIs ─────────────────────────────────────────────

    /**
     * Save a draft (create or update)
     */
    saveDraft: async (data: {
        draftId?: string;
        currentStep: number;
        draftData: any;
        birthData?: any;
        horoscopeJson?: any;
        inputHash?: string;
    }): Promise<ApiResponse<{ draftId: string; currentStep: number; savedAt: string }>> => {
        return api.post('/profiles/draft', data);
    },

    /**
     * Get a draft by ID
     */
    getDraft: async (draftId: string): Promise<ApiResponse<any>> => {
        return api.get(`/profiles/draft/${draftId}`);
    },

    /**
     * Cancel a draft
     */
    cancelDraft: async (draftId: string): Promise<ApiResponse<{ cancelled: boolean }>> => {
        return api.patch(`/profiles/draft/${draftId}/cancel`);
    },

    /**
     * Publish a draft (create profile from draft)
     */
    publish: async (draftId: string): Promise<ApiResponse<{
        profileId: string;
        profile: any;
        horoscopeVersion: number;
        createdAt: string;
    }>> => {
        return api.post('/profiles', { draftId });
    },

    // ─── Profile CRUD ──────────────────────────────────────────
    create: async (data: Partial<Profile>): Promise<ApiResponse<Profile>> => {
        return api.post('/profiles', data);
    },

    /**
     * Update an existing profile
     */
    update: async (id: string, data: Partial<Profile>): Promise<ApiResponse<Profile>> => {
        return api.patch(`/profiles/${id}`, data);
    },

    /**
     * Delete a profile
     */
    delete: async (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
        return api.delete(`/profiles/${id}`);
    },

    /**
     * Toggle profile visibility status
     */
    toggleStatus: async (id: string, status: string): Promise<ApiResponse<Profile>> => {
        return api.patch(`/profiles/${id}/status`, { status });
    },

    /**
     * Upload profile images (photo, rasi, navamsa, gallery)
     */
    uploadImage: async (id: string, type: string, file: File, index?: number): Promise<ApiResponse<{ url: string }>> => {
        const formData = new FormData();
        formData.append('image', file);
        const url = `/profiles/${id}/images/${type}${index !== undefined ? `?index=${index}` : ''}`;
        return api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    /**
     * Delete a profile image (photo, rasi, navamsa, or gallery)
     */
    deleteImage: async (id: string, type: string, index?: number): Promise<ApiResponse<{ deleted: boolean }>> => {
        const url = `/profiles/${id}/images/${type}${index !== undefined ? `?index=${index}` : ''}`;
        return api.delete(url);
    }
};
