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
  viewDetails: string;
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
  paymentMethod?: string;
  snapshotPlanCode: string;
  snapshotPlanName: string;
  snapshotDisplayPrice: number;
  snapshotDurationDays: number;
  snapshotOpenLimit: number;
  snapshotShortlistLimit: number;
  snapshotProfileSlotLimit: number;
  snapshotViewDetails: string;
  snapshotPrintProfile: boolean;
  snapshotPrintHoroscope: boolean;
  snapshotSearchLevel: string;
}

export interface MembershipCapabilities {
  openLimit: number;
  shortlistLimit: number;
  profileSlotLimit: number;
  viewDetails: string;
  printProfile: boolean;
  printHoroscope: boolean;
  searchLevel: string;
}

export interface BillingOverview {
  currentPlan: {
    name: string;
    expiresAt: string | null;
    planCode: string;
  } | null;
  capabilities: {
    searchLevel: string;
    profileSlotLimit: number;
    shortlistLimit: number;
    printProfile: boolean;
  } | null;
  plans: Array<{
    code: string;
    displayName: string;
    displayPrice: number;
    durationDays: number;
    openLimit: number;
    shortlistLimit: number;
    profileSlotLimit: number;
    viewDetails: string;
    printProfile: boolean;
    printHoroscope: boolean;
    searchLevel: string;
  }>;
  history: Array<{
    planName: string;
    amount: number;
    startedAt: string;
    expiresAt: string;
    status: string;
  }>;
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

export function getBillingOverview(): Promise<BillingOverview> {
  return api.get('/membership/billing-overview');
}
