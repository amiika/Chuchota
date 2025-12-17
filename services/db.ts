
export const DB_NAME = 'chuchota_dictionaries_db';
export const STORE_NAME = 'ipa_mappings';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Compound key for language and word
        db.createObjectStore(STORE_NAME, { keyPath: ['lang', 'word'] });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.ipa);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Database access error", e);
    return undefined;
  }
}

export async function isLanguagePopulated(lang: string): Promise<boolean> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  // Use a cursor to see if any entries exist for this language
  const range = IDBKeyRange.bound([lang, ""], [lang, "\uffff"]);
  const request = store.openCursor(range);
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => resolve(false);
  });
}
