import api from '../lib/api';

export interface VerificationQueueParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function fetchVerificationQueue(params: VerificationQueueParams = {}) {
  return api.get('/admin/verification/queue', { params });
}

export function approveProfile(id: string) {
  return api.post(`/admin/verification/${id}/approve`);
}

export function rejectProfile(id: string, reasonEn: string, reasonTa?: string) {
  return api.post(`/admin/verification/${id}/reject`, { reasonEn, reasonTa });
}

export function fetchVerificationStats() {
  return api.get('/admin/verification/stats');
}

export function fetchAdminProfiles(params: Record<string, any> = {}) {
  return api.get('/admin/profiles', { params });
}

export function fetchAdminProfileDetail(id: string) {
  return api.get(`/admin/profiles/${id}`);
}

export function archiveProfile(id: string, reasonEn: string, reasonTa?: string) {
  return api.post(`/admin/profiles/${id}/archive`, { reasonEn, reasonTa });
}

export function restoreProfile(id: string) {
  return api.post(`/admin/profiles/${id}/restore`);
}
