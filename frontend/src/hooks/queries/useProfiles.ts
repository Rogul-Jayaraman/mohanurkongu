import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '../../api/profiles.api';
import { Profile } from '../../types';

/**
 * Hook to list profiles
 */
export const useProfilesQuery = (params: any = {}) => {
  return useQuery({
    queryKey: ['profiles', 'list', params],
    queryFn: () => profilesApi.list(params),
    select: (response) => ({
      profiles: response.data,
      meta: response.meta
    }),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get user's own profiles
 */
export const useMyProfilesQuery = () => {
  return useQuery({
    queryKey: ['profiles', 'my', {}],
    queryFn: () => profilesApi.myProfiles(),
    select: (response) => response.data,
    staleTime: 0, // Always fresh for management
  });
};

/**
 * Hook to get profile details
 */
export const useProfileDetailQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['profiles', 'detail', id],
    queryFn: () => profilesApi.detail(id),
    select: (response) => response.data,
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Mutation for creating a profile
 */
export const useCreateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Profile>) => profilesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
    },
  });
};

/**
 * Mutation for updating a profile
 */
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Profile> }) => 
      profilesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'detail', id] });
    },
  });
};

/**
 * Mutation for deleting a profile
 */
export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profilesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
    },
  });
};

/**
 * Mutation for toggling profile status
 */
export const useToggleProfileStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      profilesApi.toggleStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'detail', id] });
    },
  });
};

/**
 * Mutation for uploading profile images
 * NOTE: Does NOT invalidate detail query — local state handles the preview.
 * Only invalidates 'my' list for card thumbnail refresh.
 */
export const useUploadProfileImageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, file, index }: { id: string; type: string; file: File; index?: number }) => 
      profilesApi.uploadImage(id, type, file, index),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
    },
  });
};

/**
 * Mutation for deleting profile images (Cloudinary + DB)
 * NOTE: Does NOT invalidate detail query — local state handles the UI update.
 */
export const useDeleteProfileImageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, index }: { id: string; type: string; index?: number }) => 
      profilesApi.deleteImage(id, type, index),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
    },
  });
};

// ─── Draft Hooks ────────────────────────────────────────────────

export const useSaveDraftMutation = () => {
  return useMutation({
    mutationFn: (data: Parameters<typeof profilesApi.saveDraft>[0]) => profilesApi.saveDraft(data),
  });
};

export const useResumeDraftQuery = (draftId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['draft', draftId],
    queryFn: () => profilesApi.getDraft(draftId!),
    select: (response) => response.data,
    enabled: !!draftId && enabled,
    staleTime: 0,
    retry: 1,
  });
};

export const useCancelDraftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => profilesApi.cancelDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] });
    },
  });
};

export const usePublishProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => profilesApi.publish(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'list'] });
    },
  });
};
