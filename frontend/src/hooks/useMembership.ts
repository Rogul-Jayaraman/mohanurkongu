import { useState, useEffect, useCallback } from 'react';
import { listPlans, getMySubscription, getMyCapabilities } from '@/api/membership.api';
import type { MembershipPlan, SubscriptionInfo, MembershipCapabilities } from '@/api/membership.api';

export function useMembership() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [capabilities, setCapabilities] = useState<MembershipCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const { plans: data } = await listPlans();
      setPlans(data);
    } catch {
      // non-critical
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const { subscription: sub, capabilities: caps } = await getMySubscription();
      setSubscription(sub);
      setCapabilities(caps);
    } catch {
      // non-critical
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchPlans(), fetchSubscription()]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load membership data');
    } finally {
      setLoading(false);
    }
  }, [fetchPlans, fetchSubscription]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plans, subscription, capabilities, loading, error, refresh };
}
