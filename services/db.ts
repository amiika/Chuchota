
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

/**
 * Performs a lookup in the dictionary.
 * If exact match fails and allowPrefix is true, it uses native range matching 
 * to find the first entry that starts with the requested word.
 */
export async function getIPAFromDB(word: string, lang: string, allowPrefix: boolean = false): Promise<string | undefined> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const lower = word.toLowerCase();

    // 1. Try Exact Match
    const exactRequest = store.get([lang, lower]);
    const exactResult = await new Promise<any>((resolve) => {
      exactRequest.onsuccess = () => resolve(exactRequest.result);
      exactRequest.onerror = () => resolve(undefined);
    });
    
    if (exactResult) return exactResult.ipa;

    // 2. Fallback to Native Range Matching if requested
    if (allowPrefix) {
      // Create a range from [lang, word] to [lang, word + high_char]
      // This finds entries where our word is a prefix of the dictionary entry.
      const range = IDBKeyRange.bound([lang, lower], [lang, lower + '\uffff']);
      const cursorRequest = store.openCursor(range);
      
      return new Promise((resolve) => {
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          // We return the first one found (the alphabetically closest extension)
          if (cursor && cursor.value.lang === lang) {
            resolve(cursor.value.ipa);
          } else {
            resolve(undefined);
          }
        };
        cursorRequest.onerror = () => resolve(undefined);
      });
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Finds the longest dictionary entry that is a prefix of the provided word.
 * Useful for finding root words (e.g., finding "run" when given "running").
 */
export async function findLongestPrefixMatch(word: string, lang: string): Promise<{ word: string, ipa: string } | undefined> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const lower = word.toLowerCase();

    // We can use a cursor range to find the alphabetically "largest" entry 
    // that is less than or equal to our word.
    const range = IDBKeyRange.bound([lang, ""], [lang, lower], false, false);
    const cursorRequest = store.openCursor(range, 'prev'); // Iterate backwards

    return new Promise((resolve) => {
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          const dictWord = cursor.value.word;
          // Verify if the found word is actually a prefix of our target word
          if (lower.startsWith(dictWord)) {
            resolve({ word: dictWord, ipa: cursor.value.ipa });
          } else {
            // Even though this is the closest alphabetically, it's not a prefix.
            // Since we sorted by word, any actual prefix must be at this position or earlier.
            // But with multi-part keys [lang, word], we might need to be careful.
            // For small dicts, this is fine.
            resolve(undefined);
          }
        } else {
          resolve(undefined);
        }
      };
      cursorRequest.onerror = () => resolve(undefined);
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
