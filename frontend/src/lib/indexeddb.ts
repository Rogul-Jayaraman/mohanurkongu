const DB_NAME = 'kongu_profile_draft';
const DB_VERSION = 1;
const STORE_NAME = 'profile_draft';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface ProfileDraft {
  profileId?: string;
  basic: Record<string, unknown>;
  community: Record<string, unknown>;
  professional: Record<string, unknown>;
  family: Record<string, unknown>;
  horoscope: Record<string, unknown>;
  photos: { primaryUploadId: string | null; primaryUploadUrl: string | null; galleryUploadIds: string[]; galleryUploadUrls: string[] };
  assets: Record<string, unknown>;
  partnerPreference: Record<string, unknown>;
  translations: Array<Record<string, unknown>>;
  updatedAt: number;
}

async function getDraft(): Promise<ProfileDraft | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function saveDraft(draft: ProfileDraft): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: 'current', ...draft });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function clearDraft(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('current');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

export const indexedDBStorage = { getDraft, saveDraft, clearDraft };
