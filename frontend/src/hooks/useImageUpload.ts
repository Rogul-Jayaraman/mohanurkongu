import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadFile } from '../api/profile.api';

export type UploadSlotState = 'idle' | 'selected' | 'optimizing' | 'uploading' | 'completed' | 'error';

export interface UploadSlot {
  state: UploadSlotState;
  uploadId: string | null;
  url: string | null;
  previewUrl: string | null;
  file: File | null;
  error?: string;
}

export function useImageUpload() {
  const [slots, setSlots] = useState<Record<string, UploadSlot>>({});
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const cleanupPreview = useCallback((slotKey: string) => {
    const s = slotsRef.current[slotKey];
    if (s?.previewUrl) {
      URL.revokeObjectURL(s.previewUrl);
    }
  }, []);

  const upload = useCallback(async (slotKey: string, file: File, category: string): Promise<string | null> => {
    cleanupPreview(slotKey);
    const previewUrl = URL.createObjectURL(file);
    setSlots(prev => ({ ...prev, [slotKey]: { state: 'selected', uploadId: null, url: null, previewUrl, file } }));

    setSlots(prev => ({ ...prev, [slotKey]: { state: 'optimizing', uploadId: null, url: null, previewUrl, file } }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    setSlots(prev => ({ ...prev, [slotKey]: { state: 'uploading', uploadId: null, url: null, previewUrl, file } }));

    try {
      const result = await uploadFile(formData);
      URL.revokeObjectURL(previewUrl);
      setSlots(prev => ({
        ...prev,
        [slotKey]: { state: 'completed', uploadId: result.uploadId, url: result.url, previewUrl: null, file: null },
      }));
      return result.uploadId;
    } catch (err: any) {
      URL.revokeObjectURL(previewUrl);
      setSlots(prev => ({
        ...prev,
        [slotKey]: { state: 'error', uploadId: null, url: null, previewUrl: null, file: null, error: err?.message || 'Upload failed' },
      }));
      return null;
    }
  }, [cleanupPreview]);

  const reset = useCallback((slotKey: string) => {
    cleanupPreview(slotKey);
    setSlots(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  }, [cleanupPreview]);

  const getResult = useCallback((slotKey: string): { uploadId: string | null; url: string | null } | null => {
    const slot = slotsRef.current[slotKey];
    if (!slot || slot.state !== 'completed') return null;
    return { uploadId: slot.uploadId, url: slot.url };
  }, []);

  useEffect(() => {
    return () => {
      Object.entries(slotsRef.current).forEach(([key, slot]) => {
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      });
    };
  }, []);

  return { slots, upload, reset, getResult };
}
