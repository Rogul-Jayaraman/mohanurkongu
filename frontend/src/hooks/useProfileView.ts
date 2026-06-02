import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { resolveErrorType } from '@/lib/errors';
import type { ErrorType } from '@/lib/errors';
import type { Profile } from '@/types/profile';
import { useProfileQuery } from '@/queries/useProfileQueries';
import { useToggleShortlistMutation } from '@/queries/useProfileMutations';
import { queryKeys } from '@/queries/queryKeys';

export type ViewerRole = 'self' | 'admin' | 'public';

export interface UseProfileViewResult {
  profile: Profile | null;
  loading: boolean;
  errorType: ErrorType;
  errorMessage: string | null;
  viewerRole: ViewerRole;
  inviteSent: boolean;
  shortlisted: boolean;
  handleRetry: () => void;
  handleToggleShortlist: () => Promise<void>;
  handleSendInvite: () => Promise<void>;
}

export function useProfileView(profileId: string | undefined): UseProfileViewResult {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [inviteSent, setInviteSent] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const profileQuery = useProfileQuery(profileId);
  const toggleMutation = useToggleShortlistMutation();

  const profile: Profile | null = profileQuery.data ?? null;
  const loading = profileQuery.isPending && !profileQuery.isFetched;
  const errorType: ErrorType = profileQuery.error
    ? resolveErrorType(profileQuery.error).type
    : null;
  const errorMessage = profileQuery.error
    ? resolveErrorType(profileQuery.error).message
    : null;

  const viewerRole: ViewerRole = (() => {
    if (!user || !profile) return 'public';
    if (profile.createdBy === user.id) return 'self';
    if (user.roles?.includes('ADMIN')) return 'admin';
    return 'public';
  })();

  const handleRetry = useCallback(() => {
    if (profileId) {
      qc.invalidateQueries({ queryKey: queryKeys.profile.detail(profileId) });
    }
  }, [qc, profileId]);

  const handleToggleShortlist = useCallback(async () => {
    if (!profile) return;
    const action = shortlisted ? 'remove' : 'add';
    try {
      await toggleMutation.mutateAsync({ profileId: profile.id, action });
      setShortlisted((prev) => !prev);
    } catch {
      // optimistic UI: snackbar already shown by mutation onError
    }
  }, [profile, shortlisted, toggleMutation]);

  const handleSendInvite = useCallback(async () => {
    if (!profile || inviteSent) return;
    setInviteSent(true);
  }, [profile, inviteSent]);

  return {
    profile,
    loading,
    errorType,
    errorMessage,
    viewerRole,
    inviteSent,
    shortlisted,
    handleRetry,
    handleToggleShortlist,
    handleSendInvite,
  };
}
