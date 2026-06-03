import { useQuery } from '@tanstack/react-query';
import {
  fetchProfile,
  browseProfiles,
  fetchMyProfiles,
  fetchShortlisted,
  fetchShowcaseProfiles,
} from '../api/profile.api';
import { fetchAdminProfiles, fetchAdminProfileDetail, fetchAuditTrail } from '../api/verification.api';
import {
  fetchVerificationQueue,
  fetchVerificationStats,
} from '../api/verification.api';
import { queryKeys } from './queryKeys';
import type { BrowseProfilesParams, CursorParams } from '../types/profile';
import type { VerificationQueueParams } from '../api/verification.api';

export function useProfileQuery(profileId: string | undefined, options?: { signal?: AbortSignal; enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.profile.detail(profileId ?? ''),
    queryFn: ({ signal: s }) => fetchProfile(profileId!, s ?? options?.signal),
    enabled: (options?.enabled ?? true) && !!profileId,
    staleTime: 120_000,
  });
}

export function useBrowseProfilesQuery(
  params: BrowseProfilesParams,
  options?: { signal?: AbortSignal; enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.profile.list(params),
    queryFn: ({ signal: s }) => browseProfiles({ ...params, signal: s ?? options?.signal } as any),
    enabled: options?.enabled ?? true,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useMyProfilesQuery(q?: string) {
  return useQuery({
    queryKey: [...queryKeys.profile.my(), q ?? null] as const,
    queryFn: () => fetchMyProfiles(q),
    staleTime: 120_000,
  });
}

export function useShortlistedQuery(params: CursorParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.profile.shortlisted(), params] as const,
    queryFn: () => fetchShortlisted(params),
    staleTime: 30_000,
  });
}

export function useShowcaseQuery() {
  return useQuery({
    queryKey: queryKeys.profile.showcase(),
    queryFn: () => fetchShowcaseProfiles(),
    staleTime: 300_000,
    gcTime: 30 * 60_000,
  });
}

export function useAdminProfilesQuery(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.profile.adminList(filters),
    queryFn: () => fetchAdminProfiles(filters),
    staleTime: 15_000,
  });
}

export function useAdminProfileDetailQuery(id: string | undefined) {
  return useQuery<any>({
    queryKey: queryKeys.profile.adminDetail(id ?? ''),
    queryFn: () => fetchAdminProfileDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAuditTrailQuery(profileId: string | undefined) {
  return useQuery<any>({
    queryKey: queryKeys.profile.audit(profileId ?? ''),
    queryFn: () => fetchAuditTrail(profileId!),
    enabled: !!profileId,
    staleTime: 30_000,
  });
}

export function useVerificationQueueQuery(filters: VerificationQueueParams = {}) {
  return useQuery({
    queryKey: queryKeys.verification.queue(filters),
    queryFn: () => fetchVerificationQueue(filters),
    staleTime: 15_000,
  });
}

export function useVerificationStatsQuery() {
  return useQuery({
    queryKey: queryKeys.verification.stats(),
    queryFn: () => fetchVerificationStats(),
    staleTime: 30_000,
  });
}
