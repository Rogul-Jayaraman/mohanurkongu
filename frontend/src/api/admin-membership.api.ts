import api from '../lib/api';
import type { MembershipPlan, SubscriptionInfo } from './membership.api';
import type { PaymentMethodType } from './admin-accounts.api';

export interface UpdatePlanDto {
  displayName?: string;
  displayPrice?: number;
  durationDays?: number;
  status?: string;
  openLimit?: number;
  shortlistLimit?: number;
  profileSlotLimit?: number;
  viewDetails?: string;
  printProfile?: boolean;
  printHoroscope?: boolean;
  searchLevel?: string;
}

export function adminListPlans(): Promise<{ plans: MembershipPlan[] }> {
  return api.get('/admin/membership/plans');
}

export function adminUpdatePlan(planId: string, dto: UpdatePlanDto): Promise<{ plan: MembershipPlan }> {
  return api.patch(`/admin/membership/plans/${planId}`, dto);
}

export function adminGetSetting(): Promise<{ membershipEnabled: boolean }> {
  return api.get('/admin/membership/settings');
}

export function adminUpdateSetting(membershipEnabled: boolean): Promise<{ membershipEnabled: boolean }> {
  return api.put('/admin/membership/settings', { membershipEnabled });
}

export function adminAssignSubscription(accountId: string, planId: string, options?: { paymentMethod?: PaymentMethodType; notes?: string }): Promise<{ subscription: SubscriptionInfo }> {
  return api.post('/admin/membership/subscriptions', { accountId, planId, ...options });
}

export function adminCancelSubscription(accountId: string, action: 'cancel' | 'revert'): Promise<{ subscription: any }> {
  return api.post(`/admin/membership/subscriptions/${accountId}/cancel`, { action });
}

export function adminListSubscriptions(params: { limit?: number; cursor?: string; status?: string }): Promise<{ subscriptions: SubscriptionInfo[]; pagination: { cursor: string | null; hasMore: boolean } }> {
  return api.get('/admin/membership/subscriptions', { params });
}

export function adminGetSubscriptionHistory(accountId: string): Promise<{ history: SubscriptionInfo[] }> {
  return api.get(`/admin/membership/subscriptions/${accountId}/history`);
}
