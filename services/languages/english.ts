
import { enDictionary } from './enData';

// A rule-based English G2P (Grapheme-to-Phoneme) engine.

// --- 0. External Dictionary Loading ---

const EXT_DICT = new Map<string, string>();

try {
    const data = enDictionary as Record<string, string>;
    Object.entries(data).forEach(([word, ipa]) => {
         // Store lowercase word -> stripped IPA (remove /.../ wrappers)
        EXT_DICT.set(word.toLowerCase(), ipa.replace(/^\/|\/$/g, ''));
    });
} catch (e) {
    console.warn("Failed to load external dictionary", e);
}


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

// Small dictionary for high-frequency irregular words
// These take precedence over the external dictionary if conflicts occur, but usually we check EXT_DICT first.
// However, the original design had manual overrides here.
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
    "did": "dɪd", "get": "ɡɛt", "come": "kʌm", "made": "meɪd", "may": "meɪ", "part": "pɑɹt",
    "nv": "ɛnvi", "speech": "spitʃ", "player": "pleɪə", "test": "tɛst", "computer": "kəmpjutə",
    "hello": "hɛloʊ", "world": "wɝld", "klatt": "klæt", "synth": "sɪnθ"
};

const SUFFIX_RULES: Array<[RegExp, string, boolean]> = [
  // [pattern, IPA, attracts_stress]
  [/^tion$/, 'ʃən', false],        // -tion is always unstressed
  [/^sion$/, 'ʒən', false],        // -sion is always unstressed  
  [/^cial$/, 'ʃəl', false],        // -cial (commercial, social)
  [/^tial$/, 'ʃəl', false],        // -tial (potential, partial)
  [/^ture$/, 'tʃɚ', false],        // -ture (future, nature)
  [/^sure$/, 'ʒɚ', false],         // -sure (measure, pleasure)
  [/^geous$/, 'dʒəs', false],      // -geous (gorgeous, advantageous)
  [/^cious$/, 'ʃəs', false],       // -cious (delicious, precious)
  [/^tious$/, 'ʃəs', false],       // -tious (ambitious, nutritious)
  [/^eous$/, 'iəs', false],        // -eous (aneous, miscellaneous)
  [/^ous$/, 'əs', false],          // -ous (famous, nervous)
  [/^ious$/, 'iəs', false],        // -ious (various, serious)
  [/^uous$/, 'juəs', false],       // -uous (continuous, ambiguous)
  [/^able$/, 'əbəl', false],       // -able
  [/^ible$/, 'əbəl', false],       // -ible  
  [/^ance$/, 'əns', false],        // -ance (dominance, balance)
  [/^ence$/, 'əns', false],        // -ence (presence, silence)
  [/^ness$/, 'nəs', false],        // -ness
  [/^ment$/, 'mənt', false],       // -ment
  [/^less$/, 'ləs', false],        // -less
  [/^ful$/, 'fəl', false],         // -ful
  [/^ly$/, 'li', false],           // -ly
  [/^er$/, 'ɚ', false],            // -er (comparative, agentive)
  [/^ers$/, 'ɚz', false],          // -ers (plural of -er)
  [/^est$/, 'əst', false],         // -est (superlative)
  [/^ing$/, 'ɪŋ', false],          // -ing
  [/^ed$/, 'd', false],            // -ed (past tense base)
  [/^es$/, 'z', false],            // -es (plural/3rd person)
  [/^s$/, 'z', false],             // -s (plural/3rd person)
  [/^age$/, 'ɪdʒ', false],         // -age (package, marriage)
  [/^ive$/, 'ɪv', false],          // -ive (active, passive)
  [/^ism$/, 'ɪzəm', false],        // -ism
  [/^ist$/, 'ɪst', false],         // -ist  
  [/^ity$/, 'əti', false],         // -ity
  [/^al$/, 'əl', false],           // -al (normal, final)
  [/^ic$/, 'ɪk', true],            // -ic attracts stress (economic, systemic)
  [/^ics$/, 'ɪks', true],          // -ics attracts stress (mathematics, politics)
  [/^lity$/, 'ləti', false],       // -lity (quality, reality)  
  [/^ity$/, 'əti', false],         // -ity (other cases)
  [/^ty$/, 'ti', false],           // -ty (empty, sixty)
  [/^ary$/, 'ɛri', false],         // -ary (library, military)  
  [/^ory$/, 'ɔri', false],         // -ory (history, category)
  [/^ery$/, 'ɛri', false],         // -ery (bakery, gallery)
  [/^ry$/, 'ri', false],           // -ry (hungry, angry)
  [/^y$/, 'i', false],             // -y
  [/^le$/, 'əl', false],           // -le (simple, table)
];

const PHONEME_RULES: Array<[RegExp, string]> = [
  // Silent letter combinations
  [/^pn/, 'n'],                   // pneumonia, pneumatic
  [/^ps/, 's'],                   // psychology, psalm  
  [/^pt/, 't'],                   // pterodactyl, ptomaine
  [/^kn/, 'n'],                   // knee, knife, know
  [/^gn/, 'n'],                   // gnome, gnat, gnu
  [/^wr/, 'ɹ'],                   // write, wrong, wrist
  [/^mb$/, 'm'],                  // thumb, lamb, comb (word-final)
  [/^ght/, 't'],                  // right, might, fight
  [/^gh$/, ''],                   // silent gh at word end (though, bough)
  [/^gh/, 'ɡ'],                   // ghost, ghetto (at start)
  [/^lm/, 'm'],                   // palm, calm, psalm
  
  // Improved digraph handling
  [/^tsch/, 'tʃ'],                // German loanwords
  [/^sch/, 'sk'],                 // schema, schematic (not German)
  [/^she/, 'ʃi'],                 // she (irregular vowel)
  [/^he/, 'hi'],                  // he (irregular vowel)
  [/^ch/, 'tʃ'],                  // chair, church, much
  [/^ck/, 'k'],                   // back, pick, truck
  [/^ggi/, 'ɡi'],                 // double g before i (buggie) - prevent soft g
  [/^gge/, 'ɡe'],                 // double g before e (trigger) - prevent soft g
  [/^ggy/, 'ɡi'],                 // double g before y (muggy) - prevent soft g
  [/^gg/, 'ɡ'],                   // double g -> single g (buggy, trigger)
  [/^dg/, 'dʒ'],                  // bridge, judge, edge
  [/^ph/, 'f'],                   // phone, graph, elephant
  [/^sh/, 'ʃ'],                   // shoe, fish, wash
  [/^thr/, 'θɹ'],                 // th + r cluster is always voiceless: through, three
  [/^th(?=ink)/, 'θ'],            // voiceless: think, thinking
  [/^th(?=ing$)/, 'θ'],           // voiceless: thing (complete word)
  [/^th(?=ick)/, 'θ'],            // voiceless: thick, thicker
  [/^th(?=orn)/, 'θ'],            // voiceless: thorn, thorny
  [/^th(?=rough)/, 'θ'],          // voiceless: through (already handled above)
  [/^the/, 'ðə'],                 // the (definite article)
  [/^th(?=[aeiou])/, 'ð'],        // voiced before vowels: this, that, they
  [/^th/, 'θ'],                   // voiceless (default): path, math
  [/^tch/, 'tʃ'],                 // watch, match, catch
  [/^wh/, 'w'],                   // what, where, when
  [/^qu/, 'kw'],                  // queen, quick, quote
  [/^ng/, 'ŋ'],                   // sing, ring, king
  
  // Improved vowel teams with better quality distinctions
  [/^oo/, 'uː'],                  // boot, moon, cool, moose (long u)
  [/^ou/, 'aʊ'],                  // house, about, cloud
  [/^ow(?=[snmk])/, 'aʊ'],        // cow, down, brown (before consonants)
  [/^ow/, 'oʊ'],                  // show, blow, know (at word end typically)
  [/^oy/, 'ɔɪ'],                  // boy, toy, joy  
  [/^oi/, 'ɔɪ'],                  // coin, join, voice
  [/^au/, 'ɔ'],                   // caught, sauce, because
  [/^aw/, 'ɔ'],                   // saw, law, draw
  [/^ay/, 'eɪ'],                  // day, say, way
  [/^ai/, 'eɪ'],                  // rain, main, paid
  [/^ea/, 'i'],                   // read, seat, beat (default long)
  [/^ee/, 'i'],                   // see, tree, free
  [/^ie/, 'i'],                   // piece, field, believe  
  [/^ei/, 'eɪ'],                  // vein, weight, eight
  [/^ey/, 'eɪ'],                  // they, grey, key (at end)
  [/^ight/, 'aɪt'],               // night, right, knight (i+ght)
  [/^oa/, 'oʊ'],                  // boat, coat, road
  [/^ross/, 'ɹoʊs'],              // gross -> groʊs
  [/^oss/, 'ɔs'],                 // cross, loss (short o)
  [/^eu/, 'ju'],                  // feud, neuter, Europe
  [/^ew/, 'u'],                   // few, new, threw
  [/^ue/, 'u'],                   // true, blue, glue (at end)
  [/^ui/, 'u'],                   // fruit, suit, cruise
  
  // R-controlled vowels (rhotic)
  [/^arr/, 'æɹ'],                 // carry, marry, arrow
  [/^ar/, 'ɑɹ'],                  // car, far, start
  [/^er/, 'ɚ'],                   // her, term, serve (use ɚ for unstressed)
  [/^ir/, 'ɝ'],                   // bird, first, girl
  [/^or/, 'ɔɹ'],                  // for, port, storm
  [/^ur/, 'ɝ'],                   // fur, turn, hurt
  [/^ear/, 'ɪɹ'],                 // hear, clear, year
  [/^eer/, 'ɪɹ'],                 // deer, cheer, peer
  [/^ier/, 'ɪɹ'],                 // pier, tier
  [/^our/, 'aʊɹ'],                // hour, sour, flour
  [/^air/, 'ɛɹ'],                 // hair, fair, chair
  [/^are/, 'ɛɹ'],                 // care, share, prepare
  
  // Context-dependent consonants
  [/^c(?=[eiy])/, 's'],           // soft c: cent, city, cycle
  [/^g(?=[eiy])/, 'dʒ'],          // soft g: gem, gin, gym (but not all cases)
  [/^s(?=[eiy])/, 's'],           // s before front vowels usually stays /s/
  
  // Improved consonant clusters
  [/^spr/, 'spɹ'],                // spring, spray, spread
  [/^str/, 'stɹ'],                // string, street, strong  
  [/^scr/, 'skɹ'],                // screen, script, scratch
  [/^spl/, 'spl'],                // split, splash, splice
  [/^squ/, 'skw'],                // square, squash, squeeze
  [/^shr/, 'ʃɹ'],                 // shrimp, shrink, shrewd
  [/^bl/, 'bl'],                  // blue, black, blow
  [/^br/, 'bɹ'],                  // brown, bring, bread
  [/^cl/, 'kl'],                  // clean, close, class
  [/^cr/, 'kɹ'],                  // create, cross, cream
  [/^dr/, 'dɹ'],                  // drive, dream, drop
  [/^fl/, 'fl'],                  // fly, floor, flower
  [/^fr/, 'fɹ'],                  // from, free, friend
  [/^gl/, 'ɡl'],                  // glass, globe, glad
  [/^gr/, 'ɡɹ'],                  // green, great, group
  [/^pl/, 'pl'],                  // place, play, please
  [/^pr/, 'pɹ'],                  // problem, provide, pretty
  [/^sl/, 'sl'],                  // slow, sleep, slide
  [/^sm/, 'sm'],                  // small, smile, smell
  [/^sn/, 'sn'],                  // snow, snake, snack
  [/^sp/, 'sp'],                  // speak, space, sport
  [/^st/, 'st'],                  // start, stop, study
  [/^sw/, 'sw'],                  // sweet, swim, switch
  [/^two/, 'tu'],                 // two (special case)
  [/^tr/, 'tɹ'],                  // tree, try, travel
  [/^tw/, 'tw'],                  // twelve, twenty
  
  // Basic consonants
  [/^b/, 'b'],
  [/^c/, 'k'],                    // hard c (default)
  [/^d/, 'd'],
  [/^f/, 'f'],
  [/^g/, 'ɡ'],                    // hard g (default)
  [/^h/, 'h'],
  [/^j/, 'dʒ'],
  [/^k/, 'k'],
  [/^l/, 'l'],
  [/^m/, 'm'],
  [/^n/, 'n'],
  [/^p/, 'p'],
  [/^r/, 'ɹ'],                    // American English rhotic r
  [/^s/, 's'],
  [/^t/, 't'],
  [/^v/, 'v'],
  [/^w/, 'w'],
  [/^x/, 'ks'],                   // tax, fix, mix
  [/^y(?=[aeiou])/, 'j'],         // yes, you, year (consonantal before vowels)
  [/^y/, 'aɪ'],                   // by, my, try (vowel in other positions)
  [/^z/, 'z'],
  
  // Default vowels (short/lax in closed syllables)
  [/^a/, 'æ'],                    // cat, hat, bad
  [/^e/, 'ɛ'],                    // bed, red, get (but she -> ʃi handled above)
  [/^i/, 'ɪ'],                    // sit, hit, big
  [/^o/, 'ɑ'],                    // cot, hot, dog (American English short o)
  [/^u/, 'ʌ'],                    // cut, but, run
];

// --- 3. Helpers & Morphology ---

function wellKnown(word: string): string | undefined {
    // Check External Dictionary first
    if (EXT_DICT.has(word)) return EXT_DICT.get(word);
    
    // Fallback to embedded common dictionary
    return COMMON_DICT[word];
}

function tryMorphologicalAnalysis(word: string): string | undefined {
    const lowerWord = word.toLowerCase();
    
    // Try plural forms (-s, -es)
    if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 2) {
      const singular = lowerWord.slice(0, -1);
      const basePron = wellKnown(singular);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"].includes(lastSound)) {
          return basePron + 'ɪz';
        }
        if (["p", "t", "k", "f", "θ"].includes(lastSound)) {
          return basePron + 's';
        }
        return basePron + 'z';
      }
    }
    
    // Try possessive forms ('s)
    if (lowerWord.endsWith("'s") && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      const basePron = wellKnown(base);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"].includes(lastSound)) {
          return basePron + 'ɪz';
        }
        if (["p", "t", "k", "f", "θ"].includes(lastSound)) {
          return basePron + 's';
        }
        return basePron + 'z';
      }
    }
    
    // Try -es plural
    if (lowerWord.endsWith('es') && lowerWord.length > 3) {
      const singular = lowerWord.slice(0, -2);
      const basePron = wellKnown(singular);
      if (basePron) {
        return basePron + 'ɪz';
      }
    }
    
    // Try past tense (-ed)
    if (lowerWord.endsWith('ed') && lowerWord.length > 3) {
      const base = lowerWord.slice(0, -2);
      const basePron = wellKnown(base);
      if (basePron) {
        const lastSound = basePron.slice(-1);
        if (['t', 'd'].includes(lastSound)) {
          return basePron + 'ɪd';
        }
        if (['p', 'k', 's', 'ʃ', 'tʃ', 'f', 'θ'].includes(lastSound)) {
          return basePron + 't';
        }
        return basePron + 'd';
      }
    }
    
    // Try present participle (-ing)
    if (lowerWord.endsWith('ing') && lowerWord.length > 4) {
      const base = lowerWord.slice(0, -3);
      const basePron = wellKnown(base);
      if (basePron) {
        return basePron + 'ɪŋ';
      }
    }
    
    // Try -ly adverbs
    if (lowerWord.endsWith('ly') && !lowerWord.endsWith('ally') && lowerWord.length > 2) {
      const base = lowerWord.slice(0, -2);
      const basePron = wellKnown(base);
      if (basePron) {
        return basePron + 'li';
      }
    }
    
    return undefined;
}

function isSyllableHeavy(syllable: string): boolean {
    const vowelDigraphs = ['aa', 'ai', 'au', 'aw', 'ay', 'ea', 'ee', 'ei', 'eu', 'ey', 'ie', 'oa', 'oo', 'ou', 'ow', 'oy', 'ue', 'ui'];
    
    for (const digraph of vowelDigraphs) {
      if (syllable.includes(digraph)) return true;
    }
    
    let vowelFound = false;
    let consonantCount = 0;
    
    for (const char of syllable) {
      if (VOWELS.has(char)) {
        vowelFound = true;
        consonantCount = 0;
      } else if (vowelFound && CONSONANTS.has(char)) {
        consonantCount++;
      }
    }
    
    return consonantCount >= 1; 
}

function isLikelyCompound(word: string, syllables: string[]): boolean {
    if (syllables.length < 2) return false;
    const compoundPatterns = [
      /\w{4,}wide$/, /\w{3,}land$/, /\w{3,}work$/, /\w{3,}time$/,
      /\w{3,}way$/, /\w{3,}ward$/, /hundred/, /\w{3,}side$/, /\w{3,}where$/,
    ];
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
        // Nucleus
        let nucleus = '';
        while (i < chars.length && VOWELS.has(chars[i])) nucleus += chars[i++];

        // Onset/Coda
        let consonants = '';
        while (i < chars.length && CONSONANTS.has(chars[i])) consonants += chars[i++];

        if (i === i_before) { // Skip non-alpha
            if (syllables.length > 0 && currentSyllable.length === 0) {
                 syllables[syllables.length - 1] += chars[i];
            } else {
                currentSyllable += chars[i];
            }
            i++;
            continue;
        }

        if (nucleus) { 
            if (consonants.length === 0) {
                currentSyllable += nucleus;
                syllables.push(currentSyllable);
                currentSyllable = '';
            } else if (consonants.length === 1) {
                currentSyllable += nucleus;
                syllables.push(currentSyllable);
                currentSyllable = consonants;
            } else {
                // Maximal Onset Principle
                let splitPoint = 0;
                while (splitPoint < consonants.length) {
                  const onsetCandidate = consonants.substring(splitPoint);
                  if (VALID_ONSETS.has(onsetCandidate)) break;
                  splitPoint++;
                }

                const coda = consonants.substring(0, splitPoint);
                const nextOnset = consonants.substring(splitPoint);
                
                currentSyllable += nucleus + coda;
                syllables.push(currentSyllable);
                currentSyllable = nextOnset;
            }
        } else {
            currentSyllable += consonants;
        }
    }
     if (currentSyllable) syllables.push(currentSyllable);
    
    // Post-process: Merge silent 'e'
    if (syllables.length > 1 && syllables[syllables.length - 1] === 'e') {
        const last = syllables.pop();
        if (syllables.length > 0) syllables[syllables.length - 1] += last;
    }

    return syllables.filter(s => s && s.length > 0);
}

function assignStress(syllables: string[], word: string): number {
    if (syllables.length <= 1) return 0;
    const lowerWord = word.toLowerCase();
    
    for (const [pattern, , attracts] of SUFFIX_RULES) {
        if (attracts && lowerWord.match(pattern)) return Math.max(0, syllables.length - 2);
    }
    
    if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion')) return Math.max(0, syllables.length - 2);
    if ((lowerWord.endsWith('ance') || lowerWord.endsWith('ence')) && syllables.length >= 3) return 1;

    // 2-syllable logic
    if (syllables.length === 2) {
      if (['be', 'de', 're', 'un', 'in', 'ex', 'pre'].some(prefix => lowerWord.startsWith(prefix))) return 1;
      return 0;
    }
    
    // 3+ syllable logic
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

    for (const [pattern, ipa] of SUFFIX_RULES) {
        if (remaining.match(pattern)) return ipa;
    }
    
    remaining = remaining.replace(/([b-df-hj-np-tv-z])\1/g, '$1');

    const endsWithSilentE = isLastSyllable && syllable.length > 1 && syllable.endsWith('e') && 
                            !['ee','le'].some(s => syllable.endsWith(s)) && CONSONANTS.has(syllable[syllable.length-2]);
    if (endsWithSilentE) remaining = syllable.slice(0, -1);

    while(remaining.length > 0) {
        let matched = false;
        for (const [pattern, ipa] of PHONEME_RULES) {
            const m = remaining.match(pattern);
            if (m) {
                phonemes.push(ipa);
                remaining = remaining.substring(m[0].length);
                matched = true;
                break;
            }
        }
        if (!matched) remaining = remaining.substring(1);
    }

    // Stress-sensitive reduction
    if (!isStressed && idx > 0 && !isLastSyllable) {
        for (let i = 0; i < phonemes.length; i++) {
             const map: Record<string,string> = {'æ':'ə', 'ɛ':'ə', 'ɑ':'ə', 'ʌ':'ə'};
             if (map[phonemes[i]]) phonemes[i] = map[phonemes[i]];
        }
    }
    
    if (!isStressed && isLastSyllable && idx > 0) {
         for (let i = 0; i < phonemes.length; i++) {
             const map: Record<string,string> = {'æ':'ə', 'ɛ':'ɪ', 'ɑ':'ə', 'ʌ':'ə'};
             if (map[phonemes[i]]) phonemes[i] = map[phonemes[i]];
        }
    }

    // Magic E
    if (endsWithSilentE && isStressed && phonemes.length > 0) {
        const map: Record<string,string> = {'æ':'eɪ', 'ɛ':'i', 'ɪ':'aɪ', 'ɑ':'oʊ', 'ʌ':'ju'};
        for (let i = phonemes.length - 1; i >= 0; i--) {
            if (map[phonemes[i]]) { phonemes[i] = map[phonemes[i]]; break; }
        }
    }

    return phonemes.join('');
}

function predict(word: string): string {
    // 1. Check dictionary (External then Internal)
    const lower = word.toLowerCase();
    
    if (EXT_DICT.has(lower)) return EXT_DICT.get(lower)!;
    if (COMMON_DICT[lower]) return COMMON_DICT[lower];

    // 2. Morphology
    const morph = tryMorphologicalAnalysis(word);
    if (morph) return morph;

    // 3. Rule-based
    const syllables = syllabify(word);
    const stressIdx = assignStress(syllables, word);
    
    const parts = syllables.map((s, i) => 
        syllableToIPA(s, i, i === stressIdx, i === syllables.length - 1)
    );

    let res = parts.join('');
    return res;
}

export function mapToSupportedIPA(ipa: string): string {
    return ipa
        .replace(/ɡ/g, 'g') // Normalize g
        .replace(/r/g, 'ɹ')  // Standardize r to turned r
        .replace(/ɐ/g, 'ə')  // Map near-open central to schwa
        .replace(/ɒ/g, 'ɔ')  // Map lot to open-o
        .replace(/ɚ/g, 'əɹ') // R-colored schwa -> schwa + r
        .replace(/ɝ/g, 'ɜɹ') // Stressed r-colored -> open-mid + r
        .replace(/ː/g, 'ː');
}

export function englishToIPA(text: string): string {
    const expanded = expandAbbreviations(text);
    const tokens = expanded.toLowerCase().match(/[\w']+|[.,!?;]|\s+/g) || [];
    
    return tokens.map(token => {
        if (!token.trim()) return token;
        if (/^[.,!?;]$/.test(token)) return token;
        
        // Priority 1: Compound Word Logic (Simple Hyphenation)
        if (token.includes('-')) {
             const parts = token.split('-');
             return parts.map(p => predict(p)).join(''); 
        }

        // Priority 2: Dictionary / Rules
        let pron = predict(token);
        
        return mapToSupportedIPA(pron);
    }).join('');
}
