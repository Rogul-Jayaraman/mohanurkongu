import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import type { Profile } from '../types';

/**
 * Fetcher function for browse profiles
 * NOTE: The centralized api client interceptor already unwraps response.data,
 * so `api.get(...)` returns the response body directly: { success, data, meta }.
 */
const fetchBrowseProfiles = async ({ pageParam = 1, queryParamsStr }: { pageParam: number, queryParamsStr: string }) => {
    // Add pagination to query params
    const params = new URLSearchParams(queryParamsStr);
    params.set('page', pageParam.toString());
    params.set('limit', '20');

    const result = await api.get(`/profiles/browse?${params.toString()}`) as any;
    // result is already { success, data: Profile[], meta: { page, limit, total, nextPage } }
    return result;
};

/**
 * Hook to manage browse profiles logic
 * Handles gender selection, search query, and API calls via TanStack Query.
 */
export const useBrowseProfiles = () => {
    const { t, i18n } = useTranslation(['dashboard', 'common', 'browse']);
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get initial gender from URL or default to FEMALE
    const initialGender = (searchParams.get('gender')?.toUpperCase() === 'MALE' ? 'MALE' : 'FEMALE');
    const [selectedGender, setSelectedGender] = useState<'FEMALE' | 'MALE'>(initialGender);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<any>({});
    
    // Build query params string for cache key and request
    const queryParamsStr = useMemo(() => {
        const queryParams = new URLSearchParams();
        queryParams.append('gender', selectedGender);
        queryParams.append('lang', i18n.language);
        if (searchQuery.trim()) {
            queryParams.append('search', searchQuery.trim());
        }
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, String(filters[key]));
            }
        });
        return queryParams.toString();
    }, [selectedGender, i18n.language, searchQuery, filters]);

    // Use infinite query for cursor-based pagination
    const {
        data: response,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading,
        refetch
    } = useInfiniteQuery({
        queryKey: ['profiles', 'browse', queryParamsStr],
        queryFn: ({ pageParam = 1 }) => fetchBrowseProfiles({ pageParam, queryParamsStr }),
        getNextPageParam: (lastPage) => lastPage?.meta?.nextPage || undefined,
        initialPageParam: 1,
    });

    // Flatten pages into a single data array
    const data = useMemo(() => {
        return response?.pages.flatMap((page: any) => page.data || []) || [];
    }, [response]);

    const isSearching = searchQuery.trim().length > 0;

    const handleGenderChange = (gender: 'FEMALE' | 'MALE') => {
        setSelectedGender(gender);
        setSearchParams(prev => {
            prev.set('gender', gender);
            return prev;
        }, { replace: true });
    };

    // Effect to sync state from URL changes (e.g. browser back/forward)
    useEffect(() => {
        const urlGender = searchParams.get('gender')?.toUpperCase();
        if (urlGender === 'MALE' || urlGender === 'FEMALE') {
            setSelectedGender(urlGender as 'MALE' | 'FEMALE');
        }
    }, [searchParams]);

    return {
        selectedGender,
        searchQuery,
        setSearchQuery,
        showFilters,
        setShowFilters,
        filters,
        setFilters,
        loading,
        data,
        error,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isSearching,
        handleGenderChange,
        t
    };
};
