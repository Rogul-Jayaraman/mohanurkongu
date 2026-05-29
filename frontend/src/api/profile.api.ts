import api from '../lib/api';
import { publicApi } from '../lib/publicApi';
import type { BrowseProfilesParams, BrowseProfileData, ShortlistToggleData, CursorParams, ShowcaseProfilesResponse } from '@/types/profile';

export async function fetchShowcaseProfiles(): Promise<ShowcaseProfilesResponse> {
  return publicApi.get('/profiles/showcase') as any;
}

export async function uploadFile(formData: FormData): Promise<{ uploadId: string; url: string }> {
  const res = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as any;
  return { uploadId: res.uploadToken, url: res.url };
}

export async function deleteUpload(uploadId: string): Promise<void> {
  await api.delete(`/uploads/${uploadId}`);
}

export async function saveDraft(dto: Record<string, unknown>): Promise<{ profileId: string }> {
  const res = await api.post('/profiles/draft', dto) as any;
  console.log('[saveDraft] response type=%s value=%o', typeof res, res);
  return res;
}

export async function resumeDraft(profileId: string): Promise<Record<string, unknown>> {
  const res = await api.get(`/profiles/draft/${profileId}`) as any;
  console.log('[resumeDraft] raw response type=%s keys=%s', typeof res, res ? Object.keys(res).join(', ') : 'null/undefined');
  if (!res || typeof res !== 'object') {
    console.error('[resumeDraft] unexpected response shape — expected object, got %s', typeof res);
    throw new Error('Unexpected response from resumeDraft');
  }
  return res;
}

export async function createProfile(dto: Record<string, unknown>): Promise<{ regNo?: string; profileId: string; status: string }> {
  const res = await api.post('/profiles/create', dto) as any;
  console.log('[createProfile] response=%o', res);
  return res;
}

export async function deleteDraft(profileId: string): Promise<void> {
  await api.delete(`/profiles/draft/${profileId}`);
}

export async function fetchMyProfiles(q?: string): Promise<any[]> {
  const params = q?.trim() ? { q } : undefined;
  return api.get('/profiles/my-profiles', { params }) as any;
}

export async function fetchProfile(id: string): Promise<any> {
  return api.get(`/profiles/${id}`) as any;
}

export async function browseProfiles(params: BrowseProfilesParams): Promise<BrowseProfileData> {
  return api.get('/profiles/browse', { params }) as any;
}

export async function toggleShortlist(profileId: string, action: 'add' | 'remove'): Promise<ShortlistToggleData> {
  return api.post(`/profiles/${profileId}/shortlist`, { action }) as any;
}

export async function fetchShortlisted(params: CursorParams): Promise<BrowseProfileData> {
  return api.get('/profiles/shortlisted', { params }) as any;
}
