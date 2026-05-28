import api from '../lib/api';

export function fetchAdminStats(): Promise<any> {
  return api.get('/admin/dashboard/stats');
}
