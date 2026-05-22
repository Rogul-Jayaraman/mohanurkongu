import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Profile } from '../types';

/**
 * Fetcher for shortlisted profiles.
 * NOTE: api interceptor already unwraps response.data,
 * so api.get() returns { success, data: Profile[], meta, error }.
 */
const fetchShortlist = async (): Promise<Profile[]> => {
    const result: any = await api.get('/shortlist');
    // result is already the response body: { success: true, data: [...] }
    return result?.data || [];
};

/**
 * Hook to manage Shortlist logic.
 * Uses TanStack Query for caching and refetch management.
 */
export const useShortlist = () => {
    const { t, i18n } = useTranslation(['dashboard', 'common']);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        data: profiles = [],
        isLoading: loading,
        error,
        refetch
    } = useQuery<Profile[]>({
        queryKey: ['shortlist'],
        queryFn: fetchShortlist,
        staleTime: 0,
    });

    const handleToggleShortlist = (_id: string, _isShortlisted: boolean) => {
        // The useToggleShortlist mutation already invalidates ['shortlist'] queries,
        // so react-query will auto-refetch. No manual state mutation needed.
    };

    const isSearching = searchQuery.trim().length > 0;

    const filteredProfiles = useMemo(() => {
        if (!isSearching) return profiles;
        const query = searchQuery.toLowerCase();
        return profiles.filter(profile => {
            const nameEn = (profile.nameEn || '').toLowerCase();
            const nameTa = (profile.nameTa || '').toLowerCase();
            const nameMatch = nameEn.includes(query) || nameTa.includes(query);
            const educationMatch = (profile.education || '').toLowerCase().includes(query);
            const regNoMatch = (profile.regNo || '').toLowerCase().includes(query);
            return nameMatch || educationMatch || regNoMatch;
        });
    }, [profiles, searchQuery, isSearching]);

    return {
        profiles,
        searchQuery,
        setSearchQuery,
        loading,
        error,
        refetch,
        isSearching,
        filteredProfiles,
        handleToggleShortlist,
        t
    };
};
