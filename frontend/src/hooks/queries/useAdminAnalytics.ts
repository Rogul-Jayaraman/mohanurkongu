import { useQuery } from '@tanstack/react-query';
import { adminAnalyticsApi } from '../../api/admin-analytics.api';

/**
 * Hook to get the full analytics data for the admin dashboard
 */
export const useAdminAnalyticsQuery = () => {
    return useQuery({
        queryKey: ['admin', 'analytics'],
        queryFn: adminAnalyticsApi.getFullAnalytics,
        select: (response) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to get basic stats (useful for quick summary cards)
 */
export const useAdminBasicStatsQuery = () => {
    return useQuery({
        queryKey: ['admin', 'analytics', 'basic'],
        queryFn: adminAnalyticsApi.getBasicStats,
        select: (response) => response.data,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};
