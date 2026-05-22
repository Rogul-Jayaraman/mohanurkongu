import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const fetchFeaturedProfiles = async () => {
  const response: any = await api.get('/public/featured-profiles');
  return response?.data;
};

export const useFeaturedProfiles = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['featured-profiles', 'login'],
    queryFn: fetchFeaturedProfiles,
    staleTime: 120000,
  });

  return {
    brides: (data?.brides || []) as any[],
    grooms: (data?.grooms || []) as any[],
    isLoading,
    error,
    refetch,
  };
};
