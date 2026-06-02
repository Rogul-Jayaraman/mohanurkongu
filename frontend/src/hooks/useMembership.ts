import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMembershipPlansQuery,
  useMySubscriptionQuery,
  useMyCapabilitiesQuery,
} from '@/queries/useMembershipQueries';
import { queryKeys } from '@/queries/queryKeys';
import type { MembershipPlan, SubscriptionInfo, MembershipCapabilities } from '@/api/membership.api';

export function useMembership() {
  const qc = useQueryClient();
  const plansQuery = useMembershipPlansQuery();
  const subQuery = useMySubscriptionQuery();
  const capsQuery = useMyCapabilitiesQuery();

  const plans: MembershipPlan[] = (plansQuery.data as any)?.plans ?? [];
  const subscription: SubscriptionInfo | null = (subQuery.data as any)?.subscription ?? null;
  const capabilities: MembershipCapabilities | null =
    (subQuery.data as any)?.capabilities ??
    ((capsQuery.data as any)?.capabilities as MembershipCapabilities) ??
    null;

  const loading = plansQuery.isPending || subQuery.isPending;
  const error = plansQuery.error
    ? (plansQuery.error as Error).message
    : subQuery.error
    ? (subQuery.error as Error).message
    : null;

  const refresh = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.membership.plans() }),
      qc.invalidateQueries({ queryKey: queryKeys.membership.mine() }),
      qc.invalidateQueries({ queryKey: queryKeys.membership.caps() }),
    ]);
  }, [qc]);

  useEffect(() => {
    if (!plansQuery.isFetched && !plansQuery.isPending) {
      plansQuery.refetch();
    }
  }, []);

  return { plans, subscription, capabilities, loading, error, refresh };
}
