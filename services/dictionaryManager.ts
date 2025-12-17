
import { isLanguagePopulated, seedLanguage } from './db';
import { Language } from './textToIpa';

/**
 * Manages the background loading and seeding of dictionaries.
 * Uses parallel fetches and IndexedDB for persistence.
 */
export async function syncDictionaries(onProgress?: (lang: Language) => void): Promise<void> {
  const languages: Language[] = ['en', 'fr', 'fi', 'ja'];
  
  console.log('%c[Chuchota] Starting background dictionary sync...', 'color: #22d3ee; font-weight: bold;');

  const tasks = languages.map(async (lang) => {
    try {
      const populated = await isLanguagePopulated(lang);
      
      if (populated) {
        console.log(`[Chuchota] Dictionary for '${lang}' already cached.`);
        return;
      }

      console.log(`[Chuchota] Downloading dictionary: ${lang}...`);
      const response = await fetch(`dictionaries/${lang}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Chuchota] Seeding IndexedDB with '${lang}' data...`);
      await seedLanguage(lang, data);
      
      console.log(`[Chuchota] ✅ '${lang}' is ready.`);
      onProgress?.(lang);
    } catch (err) {
      console.error(`[Chuchota] ❌ Failed to load '${lang}' dictionary. Falling back to rules.`, err);
    }
  });

  await Promise.all(tasks);
  console.log('%c[Chuchota] Synchronization complete.', 'color: #10b981; font-weight: bold;');
}
