
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
    const numFunc = {
        'en': enNum,
        'ja': jaNum,
        'fi': fiNum,
        'fr': frNum
    }[lang];
    
    if (!numFunc) return text;

    return text.replace(/\d+/g, (m) => numFunc(parseInt(m)));
}

export function convertToIPA(text: string, lang: Language): string {
  const expanded = processNumbers(text, lang);
  
  switch (lang) {
    case 'ja': return japaneseToIPA(expanded);
    case 'fi': return finnishToIPA(expanded);
    case 'fr': return frenchToIPA(expanded);
    case 'en': 
    default: return englishToIPA(expanded);
  }
}

// Deprecated exports for backward compatibility if needed, though mostly unused now
export { englishToIPA };
export const RULES: any[] = [];
