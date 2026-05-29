import api from '../lib/api';

export interface MembershipPlan {
  id: string;
  code: string;
  displayName: string;
  displayPrice: number;
  durationDays: number;
  status: string;
  openLimit: number;
  shortlistLimit: number;
  profileSlotLimit: number;
  contactAccess: boolean;
  fullHoroscopeAccess: boolean;
  printProfile: boolean;
  printHoroscope: boolean;
  searchLevel: string;
}

export interface SubscriptionInfo {
  id: string;
  planId: string;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  snapshotPlanCode: string;
  snapshotPlanName: string;
  snapshotDisplayPrice: number;
  snapshotDurationDays: number;
  snapshotOpenLimit: number;
  snapshotShortlistLimit: number;
  snapshotProfileSlotLimit: number;
  snapshotContactAccess: boolean;
  snapshotFullHoroscopeAccess: boolean;
  snapshotPrintProfile: boolean;
  snapshotPrintHoroscope: boolean;
  snapshotSearchLevel: string;
}

export interface MembershipCapabilities {
  openLimit: number;
  shortlistLimit: number;
  profileSlotLimit: number;
  contactAccess: boolean;
  fullHoroscopeAccess: boolean;
  printProfile: boolean;
  printHoroscope: boolean;
  searchLevel: string;
}

export function listPlans(): Promise<{ plans: MembershipPlan[] }> {
  return api.get('/membership/plans');
}

export function getMySubscription(): Promise<{ subscription: SubscriptionInfo | null; capabilities: MembershipCapabilities }> {
  return api.get('/membership/my-subscription');
}

export function getMyCapabilities(): Promise<{ capabilities: MembershipCapabilities }> {
  return api.get('/membership/my-capabilities');
}
