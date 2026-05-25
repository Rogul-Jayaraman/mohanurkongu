import api from '../lib/api';

export async function uploadFile(formData: FormData): Promise<{ uploadId: string }> {
  const res = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as any;
  return { uploadId: res.data?.uploadId || res.uploadId };
}

export async function deleteUpload(uploadId: string): Promise<void> {
  await api.delete(`/uploads/${uploadId}`);
}

export async function saveDraft(dto: Record<string, unknown>): Promise<{ profileId: string }> {
  const res = await api.post('/profiles/draft', dto) as any;
  return res.data;
}

export async function resumeDraft(profileId: string): Promise<Record<string, unknown>> {
  const res = await api.get(`/profiles/draft/${profileId}`) as any;
  return res.data;
}

export async function createProfile(dto: Record<string, unknown>): Promise<{ regNo: string; profileId: string }> {
  const res = await api.post('/profiles/create', dto) as any;
  return res.data;
}

export async function publishProfile(draftId: string, idempotencyKey: string, agreedToTerms: boolean): Promise<{ regNo: string; profileId: string; alreadyPublished: boolean }> {
  const res = await api.post('/profiles/publish', { draftId, idempotencyKey, agreedToTerms }) as any;
  return res.data;
}

export async function deleteDraft(profileId: string): Promise<void> {
  await api.delete(`/profiles/draft/${profileId}`);
}

export async function deleteProfile(profileId: string): Promise<void> {
  await api.delete(`/profiles/${profileId}`);
}
