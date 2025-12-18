
export const DB_PREFIX = 'chuchota_dict_';

// In-memory cache to prevent repeated parsing of large JSON strings from LocalStorage
const MEMORY_CACHE: Record<string, Record<string, string>> = {};

/**
 * Saves language data to memory and LocalStorage.
 */
export async function seedLanguage(lang: string, data: Record<string, string>) {
  // 1. Update In-Memory Cache
  MEMORY_CACHE[lang] = data;

  // 2. Persist to LocalStorage
  try {
    localStorage.setItem(DB_PREFIX + lang, JSON.stringify(data));
  } catch (e) {
    console.warn(`[Chuchota] LocalStorage quota exceeded for '${lang}'. Using in-memory cache only for this session.`);
  }
}

/**
 * Retrieves an IPA pronunciation from the cache or LocalStorage.
 */
export async function getIPAFromDB(word: string, lang: string): Promise<string | undefined> {
  // 1. Check Memory Cache
  if (MEMORY_CACHE[lang]) {
    return MEMORY_CACHE[lang][word.toLowerCase()];
  }

  // 2. Lazy Load from LocalStorage
  const raw = localStorage.getItem(DB_PREFIX + lang);
  if (raw) {
    try {
      // Parse and populate memory cache for subsequent lookups
      const data = JSON.parse(raw);
      MEMORY_CACHE[lang] = data;
      return data[word.toLowerCase()];
    } catch (e) {
      console.error(`[Chuchota] Corrupt dictionary data for ${lang}.`);
      return undefined;
    }
  }

  return undefined;
}

/**
 * Checks if a language dictionary exists in LocalStorage or Memory.
 */
export async function isLanguagePopulated(lang: string): Promise<boolean> {
  if (MEMORY_CACHE[lang]) return true;
  return !!localStorage.getItem(DB_PREFIX + lang);
}
