import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { browseProfiles } from '@/api/profile.api';
import { useToggleShortlistMutation } from '@/queries/useProfileMutations';
import { queryKeys } from '@/queries/queryKeys';
import type { ProfileSummary, BrowseProfilesParams, BrowseProfileData } from '@/types/profile';

interface UseBrowseProfilesOptions {
  gender: 'MALE' | 'FEMALE';
  searchQuery?: string;
  filters?: Record<string, any>;
  limit?: number;
  sort?: string;
  enabled?: boolean;
}

interface UseBrowseProfilesResult {
  profiles: ProfileSummary[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: string | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

const FILTER_KEY_MAP: Record<string, string> = {
  minAge: 'ageMin',
  maxAge: 'ageMax',
  minHeight: 'heightMin',
  maxHeight: 'heightMax',
  minWeight: 'minWeight',
  maxWeight: 'maxWeight',
  minSalary: 'salaryMin',
  maxSalary: 'salaryMax',
  jobTitle: 'jobTitle',
  currentCity: 'currentTaluk',
  nativeTaluk: 'nativeDistrict',
};

function normalizeFilterKey(key: string): string {
  return FILTER_KEY_MAP[key] || key;
}

function buildParams(
  base: UseBrowseProfilesOptions,
  cursor?: string,
): BrowseProfilesParams {
  const params: BrowseProfilesParams = { gender: base.gender, limit: base.limit ?? 20 };
  if (base.sort) params.sort = base.sort;
  if (base.searchQuery?.trim()) params.q = base.searchQuery.trim();
  if (cursor) params.cursor = cursor;
  if (base.filters) {
    Object.entries(base.filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        const normalizedKey = normalizeFilterKey(key);
        (params as any)[normalizedKey] = value;
      }
    });
  }
  return params;
}

export function useBrowseProfiles(opts: UseBrowseProfilesOptions): UseBrowseProfilesResult {
  const { gender, searchQuery = '', filters = {}, limit, sort, enabled = true } = opts;
  const qc = useQueryClient();

  const queryKey = useMemo(
    () => queryKeys.profile.browse({ gender, q: searchQuery, sort, ...filters } as any),
    [gender, searchQuery, sort, JSON.stringify(filters)],
  );

  const infinite = useInfiniteQuery<BrowseProfileData>({
    queryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => {
      const params = buildParams(opts, pageParam as string | undefined);
      return browseProfiles({ ...(params as any), signal: signal as AbortSignal } as any) as unknown as Promise<BrowseProfileData>;
    },
    getNextPageParam: (lastPage) => lastPage?.pagination?.cursor ?? undefined,
    enabled,
    staleTime: 10_000,
  });

  const profiles: ProfileSummary[] = (infinite.data?.pages ?? []).flatMap(
    (p) => p?.profiles ?? [],
  );

  const fetchNextPage = useCallback(() => {
    if (infinite.hasNextPage && !infinite.isFetchingNextPage) {
      infinite.fetchNextPage();
    }
  }, [infinite]);

  const refetch = useCallback(() => {
    infinite.refetch();
  }, [infinite]);

  return {
    profiles,
    isLoading: infinite.isPending,
    isFetchingNextPage: infinite.isFetchingNextPage,
    error: infinite.error ? (infinite.error as Error).message : null,
    hasNextPage: !!infinite.hasNextPage,
    fetchNextPage,
    refetch,
  };
}

export function useToggleShortlist() {
  const qc = useQueryClient();
  const mutation = useToggleShortlistMutation();
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    pendingRef.current = mutation.isPending ? (mutation.variables?.profileId ?? null) : null;
  }, [mutation.isPending, mutation.variables]);

  const toggle = useCallback(
    async (profileId: string, currentState: boolean): Promise<boolean> => {
      if (pendingRef.current) return currentState;
      const action = currentState ? 'remove' : 'add';
      try {
        const data = await mutation.mutateAsync({ profileId, action });
        qc.invalidateQueries({ queryKey: queryKeys.profile.shortlisted(), refetchType: 'none' });
        return data.isShortlisted;
      } catch {
        return currentState;
      }
    },
    [mutation, qc],
  );

  return { toggle, isPending: !!pendingRef.current, pendingId: pendingRef.current };
}
