import { getIPAFromDB, findLongestPrefixMatch } from '../db';

// Japanese Number Logic
const JA_NUMS = ["zero", "ichi", "ni", "san", "yon", "go", "roku", "nana", "hachi", "kyuu"];

export function numberToWords(n: number): string {
  if (n < 0) return "mainasu " + numberToWords(-n);
  if (n < 10) return JA_NUMS[n];
  if (n < 20) return "juu " + (n%10 ? JA_NUMS[n%10] : "");
  if (n < 100) return JA_NUMS[Math.floor(n/10)] + " juu " + (n%10 ? JA_NUMS[n%10] : "");
  if (n < 1000) {
      if (n === 100) return "hyaku";
      const h = Math.floor(n/100);
      const rem = n%100;
      let prefix = (h === 1 ? "" : JA_NUMS[h] + " ") + "hyaku";
      if (h === 3) prefix = "san byaku";
      if (h === 6) prefix = "roppyaku";
      if (h === 8) prefix = "happyaku";
      return prefix + (rem ? " " + numberToWords(rem) : "");
  }
  return n.toString(); 
}

const KANA_COMPOUNDS: Record<string, string> = {
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo', 'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo', 'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo', 'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo', 'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo', 'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho', 'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo', 'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒょ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo', 'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gjo', 'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo', 'ピゃ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo'
};

const KANA_BASIC: Record<string, string> = {
  // Hiragana
  'あ':'a', 'い':'i', 'う':'u', 'え':'e', 'お':'o', 'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi', 'す':'su', 'せ':'se', 'そ':'so', 'た':'ta', 'ち':'chi', 'つ':'tsu', 'て':'te', 'と':'to',
  // Fixed typo: 'ni' key should be 'に'
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no', 'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo', 'や':'ya', 'ゆ':'yu', 'よ':'yo', 'ら':'ra', 'り':'ri',
  'る':'ru', 'れ':'re', 'ろ':'ro', 'わ':'wa', 'を':'o', 'ん':'n', 'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
  'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo', 'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do',
  'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo', 'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
  // Katakana
  'ア':'a', 'イ':'i', 'ウ':'u', 'エ':'e', 'オ':'o', 'カ':'ka', 'キ':'ki', 'ク':'ku', 'ケ':'ke', 'コ':'ko',
  'サ':'sa', 'シ':'shi', 'ス':'su', 'セ':'se', 'ソ':'so', 'タ':'ta', 'チ':'chi', 'ツ':'tsu', 'テ':'te', 'ト':'to',
  'ナ':'na', 'ニ':'ni', 'ヌ':'nu', 'ネ':'ne', 'ノ':'no', 'ハ':'ha', 'ヒ':'hi', 'フ':'fu', 'ヘ':'he', 'ホ':'ho',
  'マ':'ma', 'ミ':'mi', 'ム':'mu', 'メ':'me', 'モ':'mo', 'ヤ':'ya', 'ユ':'yu', 'ヨ':'yo', 'ラ':'ra', 'リ':'ri',
  'ル':'ru', 'レ':'re', 'ロ':'ro', 'ワ':'wa', 'ヲ':'o', 'ン':'n', 'ガ':'ga', 'ギ':'gi', 'グ':'gu', 'ゲ':'ge', 'ゴ':'go',
  'ザ':'za', 'ジ':'ji', 'ズ':'zu', 'ゼ':'ze', 'ゾ':'zo', 'ダ':'da', 'ヂ':'ji', 'ヅ':'zu', 'デ':'de', 'ド':'do',
  'バ':'ba', 'ビ':'bi', 'ブ':'bu', 'ベ':'be', 'ボ':'bo', 'パ':'pa', 'ピ':'pi', 'プ':'pu', 'ペ':'pe', 'ポ':'po',
};

function normalizeJapanese(text: string): string {
    let res = text.replace(/[\uff01-\uff5e]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ');
    let out = ""; let i = 0; let geminate = false;
    while (i < res.length) {
        const c1 = res[i]; const sub2 = res.substring(i, i+2);
        if (c1 === 'っ' || c1 === 'ッ') { geminate = true; i++; continue; }
        let romaji = ""; let consumed = 1;
        if (KANA_COMPOUNDS[sub2]) { romaji = KANA_COMPOUNDS[sub2]; consumed = 2; }
        else if (KANA_BASIC[c1]) { romaji = KANA_BASIC[c1]; consumed = 1; }
        else if (c1 === 'ー') { if (out.length > 0) { const last = out[out.length - 1]; if (/[aeiou]/.test(last)) romaji = last; } consumed = 1; }
        else { romaji = c1; consumed = 1; }
        if (geminate) { if (romaji.length > 0 && /^[a-z]/i.test(romaji) && !/^[aeiou]/i.test(romaji)) out += romaji[0]; geminate = false; }
        out += romaji; i += consumed;
    }
    return out;
}

const ROMAJI_MAP: Record<string, string> = {
  'a': 'a', 'i': 'i', 'u': 'ɯ', 'e': 'e', 'o': 'o', 'ka': 'ka', 'ki': 'ki', 'ku': 'kɯ', 'ke': 'ke', 'ko': 'ko',
  'sa': 'sa', 'shi': 'ʃi', 'si': 'ʃi', 'su': 'sɯ', 'se': 'se', 'so': 'so', 'ta': 'ta', 'chi': 'tʃi', 'ti': 'tʃi', 'tsu': 'tsɯ',
  'tu': 'tsɯ', 'te': 'te', 'to': 'to', 'na': 'na', 'ni': 'ni', 'nu': 'nɯ', 'ne': 'ne', 'no': 'no', 'ha': 'ha', 'hi': 'hi',
  'fu': 'fɯ', 'hu': 'fɯ', 'he': 'he', 'ho': 'ho', 'ma': 'ma', 'mi': 'mi', 'mu': 'mɯ', 'me': 'me', 'mo': 'mo',
  'ya': 'ja', 'yu': 'jɯ', 'yo': 'jo', 'ra': 'ɾa', 'ri': 'ɾi', 'ru': 'ɾɯ', 're': 'ɾe', 'ro': 'ɾo', 'wa': 'wa', 'wo': 'o', 'n': 'n',
  'ga': 'ga', 'gi': 'gi', 'gu': 'gɯ', 'ge': 'ge', 'go': 'go', 'za': 'za', 'ji': 'dʒi', 'zi': 'dʒi', 'zu': 'zɯ', 'ze': 'ze',
  'zo': 'zo', 'da': 'da', 'di': 'dʒi', 'du': 'zɯ', 'de': 'de', 'do': 'do', 'ba': 'ba', 'bi': 'bi', 'bu': 'bɯ', 'be': 'be',
  'bo': 'bo', 'pa': 'pa', 'pi': 'pi', 'pu': 'pɯ', 'pe': 'pe', 'po': 'po', 'kya': 'kja', 'kyu': 'kjɯ', 'kyo': 'kjo',
  'sha': 'ʃa', 'shu': 'ʃɯ', 'sho': 'ʃo', 'cha': 'tʃa', 'chu': 'tʃɯ', 'cho': 'tʃo', 'nya': 'nja', 'nyu': 'njɯ', 'nyo': 'njo',
  'hya': 'hja', 'hyu': 'hjɯ', 'hyo': 'hjo', 'mya': 'mja', 'myu': 'mjɯ', 'myo': 'mjo', 'rya': 'ɾja', 'ryu': 'ɾjɯ', 'ryo': 'ɾjo',
  'gya': 'gja', 'ギャ': 'gja', 'ギュ': 'gjɯ', 'ギョ': 'gjo', 'ジャ': 'dʒa', 'ジュ': 'dʒɯ', 'ジョ': 'dʒo', 'ビャ': 'bja', 'ビュ': 'bjɯ', 'ビョ': 'bjo',
  'ピャ': 'pja', 'ピュ': 'pjɯ', 'ピョ': 'pjo',
};

async function getJapaneseIPA(token: string, useDictionary: boolean): Promise<string> {
    if (useDictionary) {
        // 1. Exact Match or Forward Prefix Match
        const direct = await getIPAFromDB(token, 'ja', true);
        if (direct) return direct.replace(/^\/|\/$/g, '');

        // 2. Longest Prefix (Root) Match
        const rootMatch = await findLongestPrefixMatch(token, 'ja');
        if (rootMatch && rootMatch.word.length > 2) {
            return rootMatch.ipa.replace(/^\/|\/$/g, '');
        }
    }

    // Fallback to manual transcription
    let output = ""; let i = 0;
    while (i < token.length) {
        if (i + 3 <= token.length) { const sub = token.substring(i, i+3); if (ROMAJI_MAP[sub]) { output += ROMAJI_MAP[sub]; i += 3; continue; } }
        if (i + 2 <= token.length) { 
            const sub = token.substring(i, i+2); 
            if (ROMAJI_MAP[sub]) { output += ROMAJI_MAP[sub]; i += 2; continue; }
            if (token[i] === token[i+1] && /[^aeioun]/.test(token[i])) { output += "ʔ"; i++; continue; }
            if (token[i] === 'o' && token[i+1] === 'u') { output += "oː"; i += 2; continue; }
            if (token[i] === 'e' && token[i+1] === 'i') { output += "eː"; i += 2; continue; }
        }
        const char = token[i]; output += ROMAJI_MAP[char] || char; i++;
    }
    return output;
}

export async function japaneseToIPA(text: string, useDictionary: boolean = true): Promise<string> {
    let normalized = normalizeJapanese(text.toLowerCase());
    const tokens = normalized.match(/[^\s.,!?;]+|[.,!?;]|\s+/g) || [];
    const results = await Promise.all(tokens.map(async (token) => {
        if (!token.trim() || /^[.,!?;]$/.test(token)) return token;
        return await getJapaneseIPA(token, useDictionary);
    }));
    return results.join('');
}