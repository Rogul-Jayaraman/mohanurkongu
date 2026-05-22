import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface ToggleShortlistResponse {
    success: boolean;
    data?: any;
    shortlisted?: boolean;
}

export const useToggleShortlist = () => {
    const queryClient = useQueryClient();

    return useMutation<ToggleShortlistResponse, Error, string>({
        mutationFn: async (profileId: string) => {
            // api interceptor already unwraps response.data,
            // so result is { success: true, data: { shortlisted: true/false } }
            const result = await api.post(`/shortlist/${profileId}`);
            return result as any;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles', 'browse'] });
            queryClient.invalidateQueries({ queryKey: ['shortlist'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
};
