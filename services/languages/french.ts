
import { frDictionary } from './frData';

const DICT = new Map<string, string>();

try {
    const data = frDictionary as Record<string, string>;
    Object.entries(data).forEach(([word, ipa]) => {
        DICT.set(word.toLowerCase(), ipa);
    });
} catch (e) {
    console.warn("Failed to load French dictionary", e);
}

// French Number logic
const FR_ONES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const FR_TENS = {10: "dix", 20: "vingt", 30: "trente", 40: "quarante", 50: "cinquante", 60: "soixante"};

export function numberToWords(n: number): string {
    if (n < 0) return "moins " + numberToWords(-n);
    if (n <= 16) return FR_ONES[n];
    if (n < 20) return "dix-" + FR_ONES[n-10];
    if (n < 70) {
        const t = Math.floor(n/10) * 10;
        const u = n % 10;
        // @ts-ignore
        if (u === 0) return FR_TENS[t];
        // @ts-ignore
        if (u === 1) return FR_TENS[t] + " et un";
        // @ts-ignore
        return FR_TENS[t] + "-" + FR_ONES[u]; 
    }
    if (n < 80) { // 70-79
        const t = 60;
        const rem = n - 60; // 10-19
        if (rem === 1 || rem === 11) return "soixante et " + numberToWords(rem);
        return "soixante-" + numberToWords(rem);
    }
    if (n < 100) { // 80-99
        const rem = n - 80;
        if (rem === 0) return "quatre-vingts";
        if (rem === 1) return "quatre-vingt-un"; 
        return "quatre-vingt-" + numberToWords(rem);
    }
    return n.toString();
}

// Regex rules for French G2P
const RULES: Array<[RegExp, string]> = [
    // 1. Special combinations
    [/^ou/, 'u'],
    [/^oi/, 'wa'],
    [/^eau/, 'o'],
    [/^au/, 'o'],
    [/^ai/, 'ɛ'],
    [/^ei/, 'ɛ'],
    [/^eu/, 'ø'],
    [/^œu/, 'ø'],
    [/^œ/, 'œ'],
    
    // 2. Nasals (simplified)
    [/^an(?=[^aeiouy]|$)/, 'ɑ̃'],
    [/^en(?=[^aeiouy]|$)/, 'ɑ̃'],
    [/^in(?=[^aeiouy]|$)/, 'ɛ̃'],
    [/^ain(?=[^aeiouy]|$)/, 'ɛ̃'],
    [/^ein(?=[^aeiouy]|$)/, 'ɛ̃'],
    [/^on(?=[^aeiouy]|$)/, 'ɔ̃'],
    [/^un(?=[^aeiouy]|$)/, 'ɛ̃'], // Standard modern merger
    
    // 3. Consonants
    [/^gn/, 'ɲ'],
    [/^ch/, 'ʃ'],
    [/^qu/, 'k'],
    [/^gu(?=[eiy])/, 'g'],
    [/^ç/, 's'],
    
    // Contextual C/G
    [/^c(?=[eiy])/, 's'],
    [/^c/, 'k'],
    [/^g(?=[eiy])/, 'ʒ'],
    [/^g/, 'g'],
    [/^j/, 'ʒ'],
    
    // S between vowels (simplified, assumes whole word processing often)
    // We handle this more robustly if we had full context, here we approximate.
    // Logic inside processor loop handles some.
    
    [/^ph/, 'f'],
    [/^th/, 't'],
    
    // R is uvular
    [/^r/, 'ʁ'],
    
    // H is silent
    [/^h/, ''],
    
    // Vowels
    [/^a/, 'a'],
    [/^e(?=[^aeiouy]{2,})/, 'ɛ'], // e followed by 2 cons
    [/^é/, 'e'],
    [/^è/, 'ɛ'],
    [/^ê/, 'ɛ'],
    [/^ë/, 'ɛ'],
    [/^e/, 'ə'], // schwa by default
    [/^i/, 'i'],
    [/^ï/, 'i'],
    [/^o/, 'o'],
    [/^ô/, 'o'],
    [/^u/, 'y'],
    [/^û/, 'y'],
    [/^ü/, 'y'],
    [/^y/, 'i'],
    
    // Basic Consonants
    [/^b/, 'b'],
    [/^d/, 'd'],
    [/^f/, 'f'],
    [/^k/, 'k'],
    [/^l/, 'l'],
    [/^m/, 'm'],
    [/^n/, 'n'],
    [/^p/, 'p'],
    [/^s/, 's'],
    [/^t/, 't'],
    [/^v/, 'v'],
    [/^w/, 'w'],
    [/^x/, 'ks'],
    [/^z/, 'z'],
];

function predict(word: string): string {
    const lower = word.toLowerCase();
    
    // Check dictionary
    if (DICT.has(lower)) return DICT.get(lower)!;
    
    let ipa = "";
    let i = 0;
    
    while(i < lower.length) {
        const remaining = lower.substring(i);
        let matched = false;
        
        // Handle 's' between vowels -> 'z'
        if (lower[i] === 's' && i > 0 && i < lower.length - 1) {
            const prev = lower[i-1];
            const next = lower[i+1];
            if (/[aeiouy]/.test(prev) && /[aeiouy]/.test(next)) {
                ipa += 'z';
                i++;
                continue;
            }
        }

        // Apply rules
        for (const [pattern, replacement] of RULES) {
            const match = remaining.match(pattern);
            if (match) {
                ipa += replacement;
                i += match[0].length;
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            // Check final silence
            // Silent final consonants: e, s, t, d, x, z, p, g (often)
            // Careful, C, R, F, L (CaReFuL) are pronounced.
            if (i === lower.length - 1) {
                 if (['e', 's', 't', 'd', 'x', 'z', 'p', 'g'].includes(lower[i])) {
                     // silent
                 } else {
                     // If it's not a rule match, maybe just append it?
                     // Usually handled by generic rules above, so this fallback is rare
                     if (!/[aeiouy]/.test(lower[i])) ipa += lower[i]; // keep consonant?
                 }
            } else {
                 ipa += lower[i]; // Fallback
            }
            i++;
        }
    }
    
    // Post-processing cleanup
    // Remove final schwa if not needed or cleanup silent letters that might have slipped
    if (ipa.endsWith('ə')) ipa = ipa.slice(0, -1);
    
    return ipa;
}

export function frenchToIPA(text: string): string {
    // Simple tokenizer
    const tokens = text.toLowerCase().match(/[\w'àâäéèêëîïôöùûüç-]+|[.,!?;]|\s+/g) || [];
    
    return tokens.map(token => {
        if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
        return predict(token);
    }).join('');
}
