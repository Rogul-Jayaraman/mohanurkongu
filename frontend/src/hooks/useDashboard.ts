import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '../context/AuthContext';
import { useTranslations } from './useTranslations';

/**
 * Fetcher for dashboard overview data.
 */
const fetchDashboardOverview = async () => {
    const response: any = await api.get('/dashboard/overview');
    return response?.data;
};

/**
 * Hook to manage Dashboard logic using TanStack Query.
 */
export const useDashboard = () => {
    const { t } = useTranslations(['common', 'dashboard']);
    const { user, setUser } = useAuth();

    const { 
        data, 
        isLoading: loading,
        error,
        refetch
    } = useQuery({
        queryKey: ['dashboard', 'overview'],
        queryFn: fetchDashboardOverview,
        staleTime: 60000, // 1 minute
    });

    // Handle user sync from dashboard data
    useEffect(() => {
        if (data?.user) {
            setUser(data.user);
        }
    }, [data?.user, setUser]);

    const brides = useMemo(() => data?.brideProfiles || [], [data]);
    const grooms = useMemo(() => data?.groomProfiles || [], [data]);
 
    return {
        user,
        loading,
        data,
        brides,
        grooms,
        error,
        refetch,
        t
    };
};
