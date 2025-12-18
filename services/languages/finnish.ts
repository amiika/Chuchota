
import { getIPAFromDB } from '../db';

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

const CHAR_MAP: Record<string, string> = {
    'a': 'ɑ', 'b': 'b', 'c': 'k', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'k', 'r': 'ɹ', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'v', 'x': 'ks',
    'z': 'ts', 'å': 'o', 'ä': 'æ', 'ö': 'ø', 'y': 'y',
};

async function predict(word: string, useDictionary: boolean): Promise<string> {
    let input = word.toLowerCase();

    // 1. Exact Lookup
    if (useDictionary) {
        const fromDB = await getIPAFromDB(input, 'fi');
        if (fromDB) return fromDB.replace(/^\/|\/$/g, '');
        
        // 2. Simple Case Stripping (Heuristic)
        const tryLookup = async (w: string, suffixIpa: string) => {
             const baseIpa = await getIPAFromDB(w, 'fi');
             if (baseIpa) return baseIpa.replace(/^\/|\/$/g, '') + suffixIpa;
             return null;
        };

        // Genitive -n / Dative -n
        if (input.endsWith('n')) {
            const res = await tryLookup(input.slice(0, -1), 'n');
            if (res) return res;
        }
        // Plural -t
        if (input.endsWith('t')) {
            const res = await tryLookup(input.slice(0, -1), 't');
            if (res) return res;
        }
        // Inessive -ssa / -ssä
        if (input.endsWith('ssa')) {
            const res = await tryLookup(input.slice(0, -3), 'ssɑ');
            if (res) return res;
        }
        if (input.endsWith('ssä')) {
            const res = await tryLookup(input.slice(0, -3), 'ssæ');
            if (res) return res;
        }
        // Elative -sta / -stä
        if (input.endsWith('sta')) {
            const res = await tryLookup(input.slice(0, -3), 'stɑ');
            if (res) return res;
        }
         if (input.endsWith('stä')) {
            const res = await tryLookup(input.slice(0, -3), 'stæ');
            if (res) return res;
        }
    }

    // 3. Rule-based
    let output = ""; 
    let i = 0;
    while (i < input.length) {
       const char = input[i];
       if (char === 'n' && input[i+1] === 'g') { output += "ŋː"; i += 2; continue; }
       if (char === 'n' && input[i+1] === 'k') { output += "ŋ"; i++; continue; }
       output += CHAR_MAP[char] || char; i++;
    }
    return output;
}

export async function finnishToIPA(text: string, useDictionary: boolean = true): Promise<string> {
    let input = text.toLowerCase();
    const tokens = input.match(/[\wåäö]+|[.,!?;]|\s+/g) || [];
    const results = await Promise.all(tokens.map(async (token) => {
         if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
         return await predict(token, useDictionary);
    }));
    return results.join('');
}
