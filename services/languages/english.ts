
import { getIPAFromDB } from '../db';

// A rule-based English G2P (Grapheme-to-Phoneme) engine.

// --- 1. Number & Text Expansion ---

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", 
              "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = { 20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety" };

export function numberToWords(n: number): string {
    if (n < 0) return "negative " + numberToWords(-n);
    if (n < 20) return ONES[n] || "";
    if (n < 100) {
        const t = Math.floor(n / 10) * 10;
        const o = n % 10;
        return (TENS[t as keyof typeof TENS] || "") + (o > 0 ? " " + ONES[o] : "");
    }
    if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 > 0 ? " " + numberToWords(n % 100) : "");
    
    if (n >= 1000000) return numberToWords(Math.floor(n/1000000)) + " million" + (n%1000000 > 0 ? " " + numberToWords(n%1000000) : "");
    if (n >= 1000) return numberToWords(Math.floor(n/1000)) + " thousand" + (n%1000 > 0 ? " " + numberToWords(n%1000) : "");
    
    return n.toString();
}

export function expandAbbreviations(text: string): string {
    // Abbreviations
    const abbr: Record<string, string> = { "mr.": "mister", "mrs.": "missus", "dr.": "doctor", "st.": "street", "co.": "company" };
    text = text.replace(/\b([a-z]+\.)/gi, (m) => abbr[m.toLowerCase()] || m);
    return text.replace(/\s+/g, " ").trim();
}

// --- 2. G2P Constants & Rules ---

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const CONSONANTS = new Set("bcdfghjklmnpqrstvwxyz".split(""));
const VALID_ONSETS = new Set(['b', 'bl', 'br', 'c', 'ch', 'cl', 'cr', 'd', 'dr', 'dw', 'f', 'fl', 'fr', 'g', 'gl', 'gr', 'gu', 'h', 'j', 'k', 'kl', 'kn', 'kr', 'l', 'm', 'n', 'p', 'ph', 'pl', 'pr', 'ps', 'qu', 'r', 'rh', 's', 'sc', 'sch', 'scr', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'sph', 'spl', 'spr', 'st', 'str', 'sv', 'sw', 't', 'th', 'thr', 'tr', 'ts', 'tw', 'v', 'w', 'wh', 'wr', 'x', 'y', 'z']);

// Small dictionary for high-frequency irregular words as fallback
const COMMON_DICT: Record<string, string> = {
    "the": "ðə", "of": "ʌv", "and": "ænd", "to": "tu", "a": "ə", "in": "ɪn", "is": "ɪz", "you": "ju",
    "that": "ðæt", "it": "ɪt", "he": "hi", "was": "wʌz", "for": "fɔɹ", "on": "ɑn", "are": "ɑɹ",
    "as": "æz", "with": "wɪð", "his": "hɪz", "they": "ðeɪ", "i": "aɪ", "at": "æt", "be": "bi",
    "this": "ðɪs", "have": "hæv", "from": "fɹʌm", "or": "ɔɹ", "one": "wʌn", "had": "hæd",
    "by": "baɪ", "word": "wɝd", "but": "bʌt", "not": "nɑt", "what": "wʌt", "all": "ɔl",
    "were": "wɝ", "we": "wi", "when": "wɛn", "your": "jɔɹ", "can": "kæn", "said": "sɛd",
    "there": "ðɛɹ", "use": "juz", "an": "æn", "each": "itʃ", "which": "wɪtʃ", "she": "ʃi",
    "do": "du", "how": "haʊ", "their": "ðɛɹ", "if": "ɪf", "will": "wɪl", "up": "ʌp",
    "other": "ʌðɚ", "about": "əbaʊt", "out": "aʊt", "many": "mɛni", "then": "ðɛn", "them": "ðɛm",
    "these": "ðiz", "so": "soʊ", "some": "sʌm", "her": "hɝ", "would": "wʊd", "make": "meɪk",
    "like": "laɪk", "him": "hɪm", "into": "ɪntu", "time": "taɪm", "has": "hæz", "look": "lʊk",
    "two": "tu", "more": "mɔɹ", "write": "ɹaɪt", "go": "ɡoʊ", "see": "si", "number": "nʌmbɚ",
    "no": "noʊ", "way": "weɪ", "could": "kʊd", "people": "pipəl", "my": "maɪ", "than": "ðæn",
    "first": "fɝst", "water": "wɑtɚ", "been": "bɪn", "call": "kɔl", "who": "hu", "oil": "ɔɪl",
    "its": "ɪts", "now": "naʊ", "find": "faɪnd", "long": "lɔŋ", "down": "daʊn", "day": "deɪ",
    "did": "dɪd", "get": "ɡɛt", "come": "kʌm", "made": "meɪd", "may": "meɪ", "part": "pɑɹt"
};

const SUFFIX_RULES: Array<[RegExp, string, boolean]> = [
  [/^tion$/, 'ʃən', false], [/^sion$/, 'ʒən', false], [/^cial$/, 'ʃəl', false], [/^tial$/, 'ʃəl', false],
  [/^ture$/, 'tʃɚ', false], [/^sure$/, 'ʒɚ', false], [/^geous$/, 'dʒəs', false], [/^cious$/, 'ʃəs', false],
  [/^tious$/, 'ʃəs', false], [/^eous$/, 'iəs', false], [/^ous$/, 'əs', false], [/^ious$/, 'iəs', false],
  [/^uous$/, 'juəs', false], [/^able$/, 'əbəl', false], [/^ible$/, 'əbəl', false], [/^ance$/, 'əns', false],
  [/^ence$/, 'əns', false], [/^ness$/, 'nəs', false], [/^ment$/, 'mənt', false], [/^less$/, 'ləs', false],
  [/^ful$/, 'fəl', false], [/^ly$/, 'li', false], [/^er$/, 'ɚ', false], [/^ers$/, 'ɚz', false],
  [/^est$/, 'əst', false], [/^ing$/, 'ɪŋ', false], [/^ed$/, 'd', false], [/^es$/, 'z', false],
  [/^s$/, 'z', false], [/^age$/, 'ɪdʒ', false], [/^ive$/, 'ɪv', false], [/^ism$/, 'ɪzəm', false],
  [/^ist$/, 'ɪst', false], [/^ity$/, 'əti', false], [/^al$/, 'əl', false], [/^ic$/, 'ɪk', true],
  [/^ics$/, 'ɪks', true], [/^lity$/, 'ləti', false], [/^ty$/, 'ti', false], [/^ary$/, 'ɛri', false],
  [/^ory$/, 'ɔri', false], [/^ery$/, 'ɛri', false], [/^ry$/, 'ri', false], [/^y$/, 'i', false],
  [/^le$/, 'əl', false],
];

const PHONEME_RULES: Array<[RegExp, string]> = [
  [/^pn/, 'n'], [/^ps/, 's'], [/^pt/, 't'], [/^kn/, 'n'], [/^gn/, 'n'], [/^wr/, 'ɹ'], [/^mb$/, 'm'],
  [/^ght/, 't'], [/^gh$/, ''], [/^gh/, 'ɡ'], [/^lm/, 'm'], [/^tsch/, 'tʃ'], [/^sch/, 'sk'],
  [/^she/, 'ʃi'], [/^he/, 'hi'], [/^ch/, 'tʃ'], [/^ck/, 'k'], [/^ggi/, 'ɡi'], [/^gge/, 'ɡe'],
  [/^ggy/, 'ɡi'], [/^gg/, 'ɡ'], [/^dg/, 'dʒ'], [/^ph/, 'f'], [/^sh/, 'ʃ'], [/^thr/, 'θɹ'],
  [/^th(?=ink)/, 'θ'], [/^th(?=ing$)/, 'θ'], [/^th(?=ick)/, 'θ'], [/^th(?=orn)/, 'θ'],
  [/^th(?=rough)/, 'θ'], [/^the/, 'ðə'], [/^th(?=[aeiou])/, 'ð'], [/^th/, 'θ'], [/^tch/, 'tʃ'],
  [/^wh/, 'w'], [/^qu/, 'kw'], [/^ng/, 'ŋ'], [/^oo/, 'uː'], [/^ou/, 'aʊ'], [/^ow(?=[snmk])/, 'aʊ'],
  [/^ow/, 'oʊ'], [/^oy/, 'ɔɪ'], [/^oi/, 'ɔɪ'], [/^au/, 'ɔ'], [/^aw/, 'ɔ'], [/^ay/, 'eɪ'],
  [/^ai/, 'eɪ'], [/^ea/, 'i'], [/^ee/, 'i'], [/^ie/, 'i'], [/^ei/, 'eɪ'], [/^ey/, 'eɪ'],
  [/^ight/, 'aɪt'], [/^oa/, 'oʊ'], [/^ross/, 'ɹoʊs'], [/^oss/, 'ɔs'], [/^eu/, 'ju'], [/^ew/, 'u'],
  [/^ue/, 'u'], [/^ui/, 'u'], [/^arr/, 'æɹ'], [/^ar/, 'ɑɹ'], [/^er/, 'ɚ'], [/^ir/, 'ɝ'], [/^or/, 'ɔɹ'],
  [/^ur/, 'ɝ'], [/^ear/, 'ɪɹ'], [/^eer/, 'ɪɹ'], [/^ier/, 'ɪɹ'], [/^our/, 'aʊɹ'], [/^air/, 'ɛɹ'],
  [/^are/, 'ɛɹ'], [/^c(?=[eiy])/, 's'], [/^g(?=[eiy])/, 'dʒ'], [/^s(?=[eiy])/, 's'], [/^spr/, 'spɹ'],
  [/^str/, 'stɹ'], [/^scr/, 'skɹ'], [/^spl/, 'spl'], [/^squ/, 'skw'], [/^shr/, 'ʃɹ'], [/^bl/, 'bl'],
  [/^br/, 'bɹ'], [/^cl/, 'kl'], [/^cr/, 'kɹ'], [/^dr/, 'dɹ'], [/^fl/, 'fl'], [/^fr/, 'fɹ'],
  [/^gl/, 'ɡl'], [/^gr/, 'ɡɹ'], [/^pl/, 'pl'], [/^pr/, 'pɹ'], [/^sl/, 'sl'], [/^sm/, 'sm'],
  [/^sn/, 'sn'], [/^sp/, 'sp'], [/^st/, 'st'], [/^sw/, 'sw'], [/^two/, 'tu'], [/^tr/, 'tɹ'],
  [/^tw/, 'tw'], [/^b/, 'b'], [/^c/, 'k'], [/^d/, 'd'], [/^f/, 'f'], [/^g/, 'ɡ'], [/^h/, 'h'],
  [/^j/, 'dʒ'], [/^k/, 'k'], [/^l/, 'l'], [/^m/, 'm'], [/^n/, 'n'], [/^p/, 'p'], [/^r/, 'ɹ'],
  [/^s/, 's'], [/^t/, 't'], [/^v/, 'v'], [/^w/, 'w'], [/^x/, 'ks'], [/^y(?=[aeiou])/, 'j'],
  [/^y/, 'aɪ'], [/^z/, 'z'], [/^a/, 'æ'], [/^e/, 'ɛ'], [/^i/, 'ɪ'], [/^o/, 'ɑ'], [/^u/, 'ʌ'],
];

// --- 3. Helpers & Morphology ---

async function wellKnown(word: string): Promise<string | undefined> {
    const fromDB = await getIPAFromDB(word, 'en');
    if (fromDB) return fromDB.replace(/^\/|\/$/g, '');
    return COMMON_DICT[word.toLowerCase()];
}

async function tryMorphologicalAnalysis(word: string): Promise<string | undefined> {
    const lowerWord = word.toLowerCase();
    
    // Simple morphology check using dictionary
    if (lowerWord.endsWith('s') && lowerWord.length > 2) {
      const singular = lowerWord.slice(0, -1);
      const basePron = await wellKnown(singular);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"].includes(lastSound)) return basePron + 'ɪz';
        if (["p", "t", "k", "f", "θ"].includes(lastSound)) return basePron + 's';
        return basePron + 'z';
      }
    }
    
    // ... more patterns ...
    return undefined;
}

function isSyllableHeavy(syllable: string): boolean {
    const vowelDigraphs = ['aa', 'ai', 'au', 'aw', 'ay', 'ea', 'ee', 'ei', 'eu', 'ey', 'ie', 'oa', 'oo', 'ou', 'ow', 'oy', 'ue', 'ui'];
    for (const digraph of vowelDigraphs) if (syllable.includes(digraph)) return true;
    let vowelFound = false;
    let consonantCount = 0;
    for (const char of syllable) {
      if (VOWELS.has(char)) { vowelFound = true; consonantCount = 0; }
      else if (vowelFound && CONSONANTS.has(char)) { consonantCount++; }
    }
    return consonantCount >= 1; 
}

function isLikelyCompound(word: string, syllables: string[]): boolean {
    if (syllables.length < 2) return false;
    const compoundPatterns = [/\w{4,}wide$/, /\w{3,}land$/, /\w{3,}work$/, /\w{3,}time$/, /\w{3,}way$/, /\w{3,}ward$/, /hundred/, /\w{3,}side$/, /\w{3,}where$/];
    return compoundPatterns.some(pattern => pattern.test(word));
}

// --- 4. Syllabification & Stress ---

function syllabify(word: string): string[] {
    if (word.length <= 3) return [word];
    const chars = word.toLowerCase().split('');
    const syllables: string[] = [];
    let currentSyllable = '';
    let i = 0;
    while (i < chars.length) {
        const i_before = i;
        let nucleus = '';
        while (i < chars.length && VOWELS.has(chars[i])) nucleus += chars[i++];
        let consonants = '';
        while (i < chars.length && CONSONANTS.has(chars[i])) consonants += chars[i++];
        if (i === i_before) { 
            if (syllables.length > 0 && currentSyllable.length === 0) syllables[syllables.length - 1] += chars[i];
            else currentSyllable += chars[i];
            i++;
            continue;
        }
        if (nucleus) { 
            if (consonants.length === 0) { currentSyllable += nucleus; syllables.push(currentSyllable); currentSyllable = ''; }
            else if (consonants.length === 1) { currentSyllable += nucleus; syllables.push(currentSyllable); currentSyllable = consonants; }
            else {
                let splitPoint = 0;
                while (splitPoint < consonants.length) {
                  const onsetCandidate = consonants.substring(splitPoint);
                  if (VALID_ONSETS.has(onsetCandidate)) break;
                  splitPoint++;
                }
                currentSyllable += nucleus + consonants.substring(0, splitPoint);
                syllables.push(currentSyllable);
                currentSyllable = consonants.substring(splitPoint);
            }
        } else currentSyllable += consonants;
    }
    if (currentSyllable) syllables.push(currentSyllable);
    if (syllables.length > 1 && syllables[syllables.length - 1] === 'e') {
        const last = syllables.pop();
        if (syllables.length > 0) syllables[syllables.length - 1] += last;
    }
    return syllables.filter(s => s && s.length > 0);
}

function assignStress(syllables: string[], word: string): number {
    if (syllables.length <= 1) return 0;
    const lowerWord = word.toLowerCase();
    for (const [pattern, , attracts] of SUFFIX_RULES) if (attracts && lowerWord.match(pattern)) return Math.max(0, syllables.length - 2);
    if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion')) return Math.max(0, syllables.length - 2);
    if (syllables.length === 2) {
      if (['be', 'de', 're', 'un', 'in', 'ex', 'pre'].some(prefix => lowerWord.startsWith(prefix))) return 1;
      return 0;
    }
    if (syllables.length >= 3) {
      if (isLikelyCompound(lowerWord, syllables)) return 0;
      const penult = syllables[syllables.length - 2];
      if (isSyllableHeavy(penult)) return syllables.length - 2;
      return Math.max(0, syllables.length - 3);
    }
    return 0;
}

function syllableToIPA(syllable: string, idx: number, isStressed: boolean, isLastSyllable: boolean): string {
    let phonemes: string[] = [];
    let remaining = syllable;
    for (const [pattern, ipa] of SUFFIX_RULES) if (remaining.match(pattern)) return ipa;
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, '$1');
    const endsWithSilentE = isLastSyllable && syllable.length > 1 && syllable.endsWith('e') && !['ee','le'].some(s => syllable.endsWith(s)) && CONSONANTS.has(syllable[syllable.length-2]);
    if (endsWithSilentE) remaining = syllable.slice(0, -1);
    while(remaining.length > 0) {
        let matched = false;
        for (const [pattern, ipa] of PHONEME_RULES) {
            const m = remaining.match(pattern);
            if (m) { phonemes.push(ipa); remaining = remaining.substring(m[0].length); matched = true; break; }
        }
        if (!matched) remaining = remaining.substring(1);
    }
    if (!isStressed && idx > 0) {
        for (let i = 0; i < phonemes.length; i++) {
             const map: Record<string,string> = {'æ':'ə', 'ɛ':'ə', 'ɑ':'ə', 'ʌ':'ə'};
             if (map[phonemes[i]]) phonemes[i] = map[phonemes[i]];
        }
    }
    if (endsWithSilentE && isStressed && phonemes.length > 0) {
        const map: Record<string,string> = {'æ':'eɪ', 'ɛ':'i', 'ɪ':'aɪ', 'ɑ':'oʊ', 'ʌ':'ju'};
        for (let i = phonemes.length - 1; i >= 0; i--) if (map[phonemes[i]]) { phonemes[i] = map[phonemes[i]]; break; }
    }
    return phonemes.join('');
}

async function predict(word: string): Promise<string> {
    const known = await wellKnown(word);
    if (known) return known;
    const morph = await tryMorphologicalAnalysis(word);
    if (morph) return morph;
    const syllables = syllabify(word);
    const stressIdx = assignStress(syllables, word);
    const parts = syllables.map((s, i) => syllableToIPA(s, i, i === stressIdx, i === syllables.length - 1));
    return parts.join('');
}

export function mapToSupportedIPA(ipa: string): string {
    return ipa.replace(/ɡ/g, 'g').replace(/r/g, 'ɹ').replace(/ɐ/g, 'ə').replace(/ɒ/g, 'ɔ').replace(/ɚ/g, 'əɹ').replace(/ɝ/g, 'ɜɹ').replace(/ː/g, 'ː');
}

export async function englishToIPA(text: string): Promise<string> {
    const expanded = expandAbbreviations(text);
    const tokens = expanded.toLowerCase().match(/[\w']+|[.,!?;]|\s+/g) || [];
    const results = await Promise.all(tokens.map(async (token) => {
        if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
        if (token.includes('-')) {
             const parts = token.split('-');
             const resolved = await Promise.all(parts.map(p => predict(p)));
             return resolved.join('');
        }
        let pron = await predict(token);
        return mapToSupportedIPA(pron);
    }));
    return results.join('');
}
