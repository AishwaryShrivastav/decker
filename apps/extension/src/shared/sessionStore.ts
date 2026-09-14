import type { CaptureSession } from './capture';

// One local recovery record. Credentials are deliberately excluded. Pending audio
// is removed as each segment completes; reset/new recording replaces this record.
let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  return database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('decker-capture', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('session');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSession(): Promise<CaptureSession | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('session').objectStore('session').get('current');
    request.onsuccess = () => resolve(request.result as CaptureSession | undefined);
    request.onerror = () => reject(request.error);
  });
}

let writes = Promise.resolve();
export function saveSession(state: CaptureSession): Promise<void> {
  const snapshot = structuredClone(state);
  const next = writes.catch(() => {}).then(async () => {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('session', 'readwrite');
      tx.objectStore('session').put(snapshot, 'current');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Session save aborted'));
    });
  });
  writes = next;
  return next;
}
