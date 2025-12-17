
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

async function predict(word: string): Promise<string> {
    const lower = word.toLowerCase();
    const fromDB = await getIPAFromDB(lower, 'fr');
    if (fromDB) return fromDB.replace(/^\/|\/$/g, '');
    let ipa = ""; let i = 0;
    while(i < lower.length) {
        const remaining = lower.substring(i); let matched = false;
        if (lower[i] === 's' && i > 0 && i < lower.length - 1) { if (/[aeiouy]/.test(lower[i-1]) && /[aeiouy]/.test(lower[i+1])) { ipa += 'z'; i++; continue; } }
        for (const [pattern, replacement] of RULES) {
            const match = remaining.match(pattern);
            if (match) { ipa += replacement; i += match[0].length; matched = true; break; }
        }
        if (!matched) { if (i === lower.length - 1) { if (!['e', 's', 't', 'd', 'x', 'z', 'p', 'g'].includes(lower[i])) { if (!/[aeiouy]/.test(lower[i])) ipa += lower[i]; } } else { ipa += lower[i]; } i++; }
    }
    return ipa.endsWith('ə') ? ipa.slice(0, -1) : ipa;
}

export async function frenchToIPA(text: string): Promise<string> {
    const tokens = text.toLowerCase().match(/[\w'àâäéèêëîïôöùûüç-]+|[.,!?;]|\s+/g) || [];
    const results = await Promise.all(tokens.map(async (token) => {
        if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
        return await predict(token);
    }));
    return results.join('');
}
