import { useApi } from './useApi';
import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useTranslations } from './useTranslations';

export const useMyProfiles = () => {
    const { user } = useAuth();
    const { t } = useTranslations(['myprofiles', 'common']);
    const API_URL = (import.meta as any).env.VITE_API_URL;

    const { data: response, loading, error, refetch } = useApi<any>(
        `/profiles?userId=${user?.id}&owner=true`,
        {},
        { ttl: 0 } // No cache for management page
    );

    // Extract profiles array from the standardized envelope
    const profiles = response?.data || [];

    const toggleProfileStatus = useCallback(async (profileId: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await axios.patch(`${API_URL}/profiles/${profileId}/status`, { status: newStatus });
            toast.success(t('myprofiles:status_updated_success'));
            refetch();
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || t('myprofiles:status_updated_error'));
        }
    }, [API_URL, refetch, t]);

    const deleteProfile = useCallback(async (profileId: string) => {
        if (!window.confirm(t('common:confirm_delete') || 'Are you sure you want to delete this profile?')) return;
        
        try {
            await axios.delete(`${API_URL}/profiles/${profileId}`);
            toast.success(t('myprofiles:delete_success') || 'Profile deleted successfully');
            refetch();
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || t('myprofiles:delete_error') || 'Failed to delete profile');
        }
    }, [API_URL, refetch, t]);

    return {
        profiles,
        loading,
        error,
        refetch,
        toggleProfileStatus,
        deleteProfile,
        t
    };
};
