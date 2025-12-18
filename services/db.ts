
export const DB_NAME = 'chuchota_dictionaries_db';
export const STORE_NAME = 'ipa_mappings';

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Opens the IndexedDB and caches the promise to ensure a singleton connection.
 */
export async function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: ['lang', 'word'] });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function seedLanguage(lang: string, data: Record<string, string>) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const [word, ipa] of Object.entries(data)) {
    store.put({ lang, word: word.toLowerCase(), ipa });
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getIPAFromDB(word: string, lang: string): Promise<string | undefined> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get([lang, word.toLowerCase()]);
    
    return new Promise((resolve) => {
      // Safety timeout: if the DB is locked by a write transaction, don't hang the TTS
      const timeout = setTimeout(() => resolve(undefined), 100);
      
      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve(request.result?.ipa);
      };
      request.onerror = () => {
        clearTimeout(timeout);
        resolve(undefined);
      };
    });
  } catch (e) {
    return undefined;
  }
}

export async function isLanguagePopulated(lang: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const range = IDBKeyRange.bound([lang, ""], [lang, "\uffff"]);
    const request = store.openCursor(range);
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}
