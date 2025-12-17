
import { fiDictionary } from './fiData';

const DICT = new Map<string, string>();

try {
    const data = fiDictionary as Record<string, string>;
    Object.entries(data).forEach(([word, ipa]) => {
        DICT.set(word.toLowerCase(), ipa);
    });
} catch (e) {
    console.warn("Failed to load Finnish dictionary", e);
}

// Finnish Number Logic
const FI_NUMS = ["nolla", "yksi", "kaksi", "kolme", "neljä", "viisi", "kuusi", "seitsemän", "kahdeksan", "yhdeksän", "kymmenen"];

export function numberToWords(n: number): string {
    if (n < 0) return "miinus " + numberToWords(-n);
    if (n <= 10) return FI_NUMS[n];
    if (n < 20) return FI_NUMS[n-10] + "toista";
    if (n < 100) {
        const t = Math.floor(n/10);
        const o = n%10;
        return FI_NUMS[t] + "kymmentä" + (o > 0 ? " " + FI_NUMS[o] : "");
    }
    if (n === 100) return "sata";
    return n.toString();
}

// Finnish G2P Converter
// Finnish is highly phonemic. Mapping is almost 1:1 with specific rules for 'ng' and 'nk'.

const CHAR_MAP: Record<string, string> = {
    'a': 'ɑ',
    'b': 'b',
    'c': 'k',
    'd': 'd',
    'e': 'e',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'i': 'i',
    'j': 'j',
    'k': 'k',
    'l': 'l',
    'm': 'm',
    'n': 'n',
    'o': 'o',
    'p': 'p',
    'q': 'k',
    'r': 'ɹ', // Using 'ɹ' (English r) as approx for trill, or 'ɾ'
    's': 's',
    't': 't',
    'u': 'u',
    'v': 'v',
    'w': 'v',
    'x': 'ks',
    'y': 'y', // Requires 'y' in IPA_DATA
    'z': 'ts',
    'å': 'o',
    'ä': 'æ',
    'ö': 'ø', // Requires 'ø' in IPA_DATA
};

export function finnishToIPA(text: string): string {
    let input = text.toLowerCase();
    
    // Check if the whole text is a single word in dictionary (simple check)
    // If text contains spaces, tokenizing would be better, but strict char-by-char works well for Finnish.
    // However, to support loanwords in sentences, we should tokenize.
    
    const tokens = input.match(/[\wåäö]+|[.,!?;]|\s+/g) || [];
    
    return tokens.map(token => {
         if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
         if (DICT.has(token)) return DICT.get(token)!;
         
         // Rule-based
         let output = "";
         let i = 0;
         while (i < token.length) {
            const char = token[i];
            
            // Handle 'ng' -> /ŋː/
            if (char === 'n' && token[i+1] === 'g') {
                output += "ŋː";
                i += 2;
                continue;
            }

            // Handle 'nk' -> /ŋk/
            if (char === 'n' && token[i+1] === 'k') {
                output += "ŋ";
                i++; // consume n, k handled next loop
                continue;
            }

            const ipa = CHAR_MAP[char];
            output += ipa || char;
            i++;
         }
         return output;
    }).join('');
}
