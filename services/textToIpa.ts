
import { englishToIPA, numberToWords as enNum } from './languages/english';
import { japaneseToIPA, numberToWords as jaNum } from './languages/japanese';
import { finnishToIPA, numberToWords as fiNum } from './languages/finnish';
import { frenchToIPA, numberToWords as frNum } from './languages/french';

export type Language = 'en' | 'ja' | 'fi' | 'fr';

export const LANGUAGES: Record<Language, string> = {
    'en': 'English',
    'fr': 'French',
    'ja': 'Japanese',
    'fi': 'Finnish'
};

function processNumbers(text: string, lang: Language): string {
    const numFunc = { 'en': enNum, 'ja': jaNum, 'fi': fiNum, 'fr': frNum }[lang];
    if (!numFunc) return text;
    return text.replace(/\d+/g, (m) => numFunc(parseInt(m)));
}

export async function convertToIPA(text: string, lang: Language): Promise<string> {
  const expanded = processNumbers(text, lang);
  switch (lang) {
    case 'ja': return await japaneseToIPA(expanded);
    case 'fi': return await finnishToIPA(expanded);
    case 'fr': return await frenchToIPA(expanded);
    case 'en': 
    default: return await englishToIPA(expanded);
  }
}
