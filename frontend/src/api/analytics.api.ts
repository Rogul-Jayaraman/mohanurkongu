import api from '@/lib/api';
import type { ManamaalaiAnalytics, MandapamAnalytics, MembershipAnalytics, OperationsAnalytics } from '@/types/analytics';

export function fetchManamaalaiAnalytics(): Promise<ManamaalaiAnalytics> {
  return api.get('/admin/analytics/matrimony') as Promise<ManamaalaiAnalytics>;
}

export function fetchMandapamAnalytics(): Promise<MandapamAnalytics> {
  return api.get('/admin/analytics/mandapam') as Promise<MandapamAnalytics>;
}

export function fetchMembershipAnalytics(): Promise<MembershipAnalytics> {
  return api.get('/admin/analytics/membership') as Promise<MembershipAnalytics>;
}

export function fetchOperationsAnalytics(): Promise<OperationsAnalytics> {
  return api.get('/admin/analytics/operations') as Promise<OperationsAnalytics>;
}
