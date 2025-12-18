
import { getIPAFromDB } from '../db';

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
        if (u === 0) return (FR_TENS as any)[t];
        if (u === 1) return (FR_TENS as any)[t] + " et un";
        return (FR_TENS as any)[t] + "-" + FR_ONES[u]; 
    }
    if (n < 80) { const t = 60; const rem = n - 60; if (rem === 1 || rem === 11) return "soixante et " + numberToWords(rem); return "soixante-" + numberToWords(rem); }
    if (n < 100) { const rem = n - 80; if (rem === 0) return "quatre-vingts"; if (rem === 1) return "quatre-vingt-un"; return "quatre-vingt-" + numberToWords(rem); }
    return n.toString();
}

const RULES: Array<[RegExp, string]> = [
    [/^ou/, 'u'], [/^oi/, 'wa'], [/^eau/, 'o'], [/^au/, 'o'], [/^ai/, 'ɛ'], [/^ei/, 'ɛ'], [/^eu/, 'ø'], [/^œu/, 'ø'],
    [/^œ/, 'œ'], [/^an(?=[^aeiouy]|$)/, 'ɑ̃'], [/^en(?=[^aeiouy]|$)/, 'ɑ̃'], [/^in(?=[^aeiouy]|$)/, 'ɛ̃'],
    [/^ain(?=[^aeiouy]|$)/, 'ɛ̃'], [/^ein(?=[^aeiouy]|$)/, 'ɛ̃'], [/^on(?=[^aeiouy]|$)/, 'ɔ̃'], [/^un(?=[^aeiouy]|$)/, 'ɛ̃'],
    [/^gn/, 'ɲ'], [/^ch/, 'ʃ'], [/^qu/, 'k'], [/^gu(?=[eiy])/, 'g'], [/^ç/, 's'], [/^c(?=[eiy])/, 's'], [/^c/, 'k'],
    [/^g(?=[eiy])/, 'ʒ'], [/^g/, 'g'], [/^j/, 'ʒ'], [/^ph/, 'f'], [/^th/, 't'], [/^r/, 'ʁ'], [/^h/, ''], [/^a/, 'a'],
    [/^e(?=[^aeiouy]{2,})/, 'ɛ'], [/^é/, 'e'], [/^è/, 'ɛ'], [/^ê/, 'ɛ'], [/^ë/, 'ɛ'], [/^e/, 'ə'], [/^i/, 'i'],
    [/^ï/, 'i'], [/^o/, 'o'], [/^ô/, 'o'], [/^u/, 'y'], [/^û/, 'y'], [/^ü/, 'y'], [/^y/, 'i'], [/^b/, 'b'], [/^d/, 'd'],
    [/^f/, 'f'], [/^k/, 'k'], [/^l/, 'l'], [/^m/, 'm'], [/^n/, 'n'], [/^p/, 'p'], [/^s/, 's'], [/^t/, 't'], [/^v/, 'v'],
    [/^w/, 'w'], [/^x/, 'ks'], [/^z/, 'z'],
];

const SILENT_FINALS = new Set(['s', 't', 'd', 'x', 'z', 'p', 'g', 'b']);

async function predict(word: string, useDictionary: boolean = true): Promise<string> {
    const lower = word.toLowerCase();
    
    // 1. Exact Lookup
    if (useDictionary) {
        const fromDB = await getIPAFromDB(lower, 'fr');
        if (fromDB) return fromDB.replace(/^\/|\/$/g, '');
    }

    // 2. Morphological Lookup (Smart Fallback for Silent Suffixes)
    if (useDictionary) {
        // Plural -s / -x (usually silent, so IPA is same as base)
        if (lower.endsWith('s') || lower.endsWith('x')) {
            const base = lower.slice(0, -1);
            const baseIpa = await getIPAFromDB(base, 'fr');
            if (baseIpa) return baseIpa.replace(/^\/|\/$/g, '');
        }
        
        // 3rd person plural -ent (silent for verbs)
        if (lower.endsWith('ent')) {
            const base = lower.slice(0, -3); // e.g., mangent -> mang
            // Try matching against 'mange' (3rd person singular / 1st person)
            const baseE = base + 'e'; 
            const baseIpa = await getIPAFromDB(baseE, 'fr');
            if (baseIpa) return baseIpa.replace(/^\/|\/$/g, '');
            
            // Try base? (rare for -ent verbs to strip to something valid without 'e' unless it's -ir/-re)
        }
    }

    return await applyRules(lower);
}

async function applyRules(text: string): Promise<string> {
    let ipa = "";
    let i = 0;
    const len = text.length;

    while (i < len) {
        const remaining = text.substring(i);
        let matched = false;

        // Special case: intervocalic 's' -> /z/
        if (text[i] === 's' && i > 0 && i < len - 1) {
            const vowels = /[aeiouyàâäéèêëîïôöùûüç]/;
            if (vowels.test(text[i - 1]) && vowels.test(text[i + 1])) {
                ipa += 'z';
                i++;
                continue;
            }
        }

        // Apply mapping rules
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
            const char = text[i];
            const isLast = i === len - 1;
            const isSecondToLast = i === len - 2;
            const nextChar = text[i+1];

            if (isLast) {
                if (!['c', 'r', 'f', 'l', 'q'].includes(char)) {
                    if (!/[aeiouyàâäéèêëîïôöùûü]/.test(char)) {
                    } else {
                        ipa += char;
                    }
                } else {
                    if (char === 'r' && text.endsWith('er') && text.length > 3) {
                    } else {
                        ipa += (char === 'r' ? 'ʁ' : char);
                    }
                }
            } 
            else if (isSecondToLast && nextChar === 'e') {
                 if (/[b-df-hj-np-tv-z]/.test(char)) {
                     const mapping: Record<string, string> = {'r': 'ʁ', 'j': 'ʒ', 's': 's', 'c': 'k', 'g': 'g'};
                     ipa += mapping[char] || char;
                 } else {
                     ipa += char;
                 }
                 i += 2; 
                 continue;
            }
            else {
                ipa += char;
            }
            i++;
        }
    }
    if (ipa.endsWith('ə')) ipa = ipa.slice(0, -1);
    return ipa.replace(/r/g, 'ʁ');
}

export async function frenchToIPA(text: string, useDictionary: boolean = true): Promise<string> {
    const tokens = text.toLowerCase().match(/[\w'àâäéèêëîïôöùûüç-]+|[.,!?;]|\s+/g) || [];
    const results = await Promise.all(tokens.map(async (token) => {
        if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
        return await predict(token, useDictionary);
    }));
    return results.join('');
}
