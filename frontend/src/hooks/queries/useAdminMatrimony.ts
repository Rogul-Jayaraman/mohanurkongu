import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMatrimonyApi } from '../../api/admin-matrimony.api';

/**
 * Hook to list accounts for admin
 */
export const useAdminAccountsQuery = (params: any = {}) => {
  return useQuery({
    queryKey: ['admin-accounts', 'list', params],
    queryFn: () => adminMatrimonyApi.listAccounts(params),
    select: (response) => ({
      accounts: response.data,
      meta: response.meta
    }),
    staleTime: 2 * 60 * 1000,
  });
};

// TODO: Re-implement useAdminPlanHistoryQuery with new plan system

/**
 * Hook to list profiles for admin
 */
export const useAdminProfilesQuery = (params: any = {}) => {
  return useQuery({
    queryKey: ['admin-profiles', 'list', params],
    queryFn: () => adminMatrimonyApi.listProfiles(params),
    select: (response) => ({
      profiles: response.data,
      meta: response.meta
    }),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to list verification profiles
 */
export const useAdminVerificationQuery = (params: any = {}) => {
  return useQuery({
    queryKey: ['admin-profiles', 'verification', params],
    queryFn: () => adminMatrimonyApi.verificationList(params),
    select: (response) => ({
      profiles: response.data,
      meta: response.meta
    }),
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook to get admin dashboard stats
 */
export const useAdminStatsQuery = () => {
  return useQuery({
    queryKey: ['admin-matrimony', 'stats'],
    queryFn: () => adminMatrimonyApi.getStats(),
    select: (response) => response.data,
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Hook to get premium price
 * Stubbed while plan system is being rebuilt.
 * TODO: Re-implement with new plan system.
 */
export const usePremiumPriceQuery = () => {
  return useQuery({
    queryKey: ['admin-matrimony', 'premium-price'],
    queryFn: () => Promise.resolve({ data: { price: 0 } }),
    select: (response: any) => response.data?.price,
    staleTime: 10 * 60 * 1000,
    enabled: false, // Disabled while plan system is being rebuilt
  });
};

/**
 * Mutation for suspending an account
 */
export const useSuspendAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reasonEn: string; reasonTa: string } }) => 
      adminMatrimonyApi.suspendAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts', 'list'] });
    },
  });
};

/**
 * Mutation for revoking account suspension
 */
export const useRevokeSuspensionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminMatrimonyApi.revokeSuspension(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts', 'list'] });
    },
  });
};

// TODO: Re-implement useUpgradePlanMutation with new plan system

/**
 * Mutation for verifying a profile
 */
export const useVerifyProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; reasonEn?: string; reasonTa?: string } }) => 
      adminMatrimonyApi.verify(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'detail', variables.id] });
    },
  });
};

/**
 * Mutation for blocking a profile
 */
export const useBlockProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { reasonEn: string; reasonTa: string } }) => 
      adminMatrimonyApi.block(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'detail', variables.id] });
    },
  });
};

/**
 * Mutation for updating profile visibility status
 */
export const useUpdateProfileStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      adminMatrimonyApi.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles', 'verification'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'detail', variables.id] });
    },
  });
};

// TODO: Re-implement useUpdatePremiumPriceMutation with new plan system
