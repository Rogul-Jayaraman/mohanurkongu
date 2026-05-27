import { useState, useEffect, useCallback, useRef } from 'react';
import { indexedDBStorage, type ProfileDraft } from '../lib/indexeddb';

export function useIndexedDB() {
  const [data, setData] = useState<ProfileDraft | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const hydrate = useCallback(async () => {
    try {
      const draft = await indexedDBStorage.getDraft();
      if (draft) setData(draft);
    } catch { console.warn('IndexedDB hydrate failed'); }
    setIsLoaded(true);
  }, []);

  const persist = useCallback(async () => {
    const current = dataRef.current;
    if (!current) return;
    try {
      await indexedDBStorage.saveDraft(current);
    } catch { console.warn('IndexedDB persist failed'); }
  }, []);

  const update = useCallback((partial: Partial<ProfileDraft>) => {
    setData(prev => prev ? { ...prev, ...partial, updatedAt: Date.now() } : null);
  }, []);

  const clear = useCallback(async () => {
    try {
      await indexedDBStorage.clearDraft();
      setData(null);
    } catch { console.warn('IndexedDB clear failed'); }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = dataRef.current;
      if (current) {
        indexedDBStorage.saveDraft(current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { data, isLoaded, hydrate, persist, update, clear };
}
