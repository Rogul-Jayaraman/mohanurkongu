import { useState, useCallback, useRef, useEffect } from 'react';
import { browseProfiles, toggleShortlist as toggleShortlistApi } from '@/api/profile.api';
import type { ProfileSummary, BrowseProfilesParams } from '@/types/profile';

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

export function useBrowseProfiles({
  gender,
  searchQuery = '',
  filters = {},
  limit,
  sort,
  enabled = true,
}: UseBrowseProfilesOptions): UseBrowseProfilesResult {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async (isNextPage: boolean) => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    if (isNextPage) {
      setIsFetchingNextPage(true);
    } else {
      setIsLoading(true);
      cursorRef.current = null;
    }
    setError(null);

    try {
      const params: BrowseProfilesParams = { gender, limit: limit ?? 20 };
      if (sort) params.sort = sort;
      if (searchQuery?.trim()) params.q = searchQuery.trim();
      if (isNextPage && cursorRef.current) params.cursor = cursorRef.current;
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            const normalizedKey = normalizeFilterKey(key);
            (params as any)[normalizedKey] = value;
          }
        });
      }

      const data = await browseProfiles(params);
      if (controller.signal.aborted) return;

      setProfiles(prev => (isNextPage ? [...prev, ...data.profiles] : data.profiles));
      cursorRef.current = data.pagination.cursor;
      setHasNextPage(data.pagination.hasMore);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(err?.message || 'Failed to load profiles');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    }
  }, [gender, searchQuery, filters, limit, sort]);

  useEffect(() => {
    if (!enabled) return;
    doFetch(false);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [doFetch, enabled]);

  const fetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;
    doFetch(true);
  }, [hasNextPage, isFetchingNextPage, isLoading, doFetch]);

  const refetch = useCallback(() => {
    doFetch(false);
  }, [doFetch]);

  return { profiles, isLoading, isFetchingNextPage, error, hasNextPage, fetchNextPage, refetch };
}

export function useToggleShortlist() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggle = useCallback(async (profileId: string, currentState: boolean): Promise<boolean> => {
    if (pendingId) return currentState;
    setPendingId(profileId);
    try {
      const action = currentState ? 'remove' : 'add';
      const data = await toggleShortlistApi(profileId, action);
      return data.isShortlisted;
    } finally {
      setPendingId(null);
    }
  }, [pendingId]);

  return { toggle, isPending: !!pendingId, pendingId };
}
