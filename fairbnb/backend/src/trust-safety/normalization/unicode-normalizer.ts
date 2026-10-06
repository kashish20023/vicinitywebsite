export interface NormalizedOutput {
  original: string;
  normalized: string;
  charMap: number[]; // maps each char index in normalized back to original
  truncated: boolean;
}

export class UnicodeNormalizer {
  private static readonly MAX_CHARS = 4096;

  // Devanagari numerals U+0966 to U+096F
  private static readonly DEVANAGARI_DIGITS: Record<string, string> = {
    '\u0966': '0',
    '\u0967': '1',
    '\u0968': '2',
    '\u0969': '3',
    '\u096A': '4',
    '\u096B': '5',
    '\u096C': '6',
    '\u096D': '7',
    '\u096E': '8',
    '\u096F': '9',
  };

  // Zero-width & invisible format characters
  private static readonly ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;

  // Keycap digits: e.g. 0️⃣ to 9️⃣
  private static readonly KEYCAP_REGEX = /([0-9])(?:\uFE0F)?\u20E3/g;

  // Explicit English digit words (word-bounded)
  private static readonly ENGLISH_DIGIT_WORDS: Array<[RegExp, string]> = [
    [/\bzero\b/gi, '0'],
    [/\bone\b/gi, '1'],
    [/\btwo\b/gi, '2'],
    [/\bthree\b/gi, '3'],
    [/\bfour\b/gi, '4'],
    [/\bfive\b/gi, '5'],
    [/\bsix\b/gi, '6'],
    [/\bseven\b/gi, '7'],
    [/\beight\b/gi, '8'],
    [/\bnine\b/gi, '9'],
  ];

  // Hindi/Hinglish unambiguous digit words
  private static readonly HINDI_DIGIT_WORDS: Array<[RegExp, string]> = [
    [/\bshunya\b/gi, '0'],
    [/\bek\b/gi, '1'],
    [/\bchaar\b/gi, '4'],
    [/\bchar\b/gi, '4'],
    [/\bpaanch\b/gi, '5'],
    [/\bpach\b/gi, '5'],
    [/\bchhe\b/gi, '6'],
    [/\bche\b/gi, '6'],
    [/\bchhah\b/gi, '6'],
    [/\bsaat\b/gi, '7'],
    [/\baath\b/gi, '8'],
    [/\bnau\b/gi, '9'],
  ];

  public static normalize(input: string): NormalizedOutput {
    if (!input || typeof input !== 'string') {
      return { original: '', normalized: '', charMap: [], truncated: false };
    }

    const truncated = input.length > this.MAX_CHARS;
    const raw = truncated ? input.substring(0, this.MAX_CHARS) : input;

    // 1. Unicode NFKC normalization
    const nfkc = raw.normalize('NFKC');

    // 2. Map Devanagari digits to 0-9
    let stage1 = '';
    const charMap: number[] = [];
    for (let i = 0; i < nfkc.length; i++) {
      const ch = nfkc[i];
      if (this.DEVANAGARI_DIGITS[ch]) {
        stage1 += this.DEVANAGARI_DIGITS[ch];
        charMap.push(i);
      } else {
        stage1 += ch;
        charMap.push(i);
      }
    }

    // 3. Replace Keycap digits
    stage1 = stage1.replace(this.KEYCAP_REGEX, '$1');

    // 4. Strip zero-width formatting characters
    stage1 = stage1.replace(this.ZERO_WIDTH_REGEX, '');

    // 5. Expand digit words if sequence looks like contact sharing
    const stage2 = this.replaceDigitWordsIfCluster(stage1);

    return {
      original: raw,
      normalized: stage2,
      charMap,
      truncated,
    };
  }

  /**
   * Replaces digit words into digits when part of intentional digit sequences,
   * preserving ordinary English sentences like 'someone is done at late hours'.
   */
  public static normalizeDigitWords(text: string): string {
    let result = text;

    for (const [regex, digit] of this.ENGLISH_DIGIT_WORDS) {
      result = result.replace(regex, digit);
    }

    for (const [regex, digit] of this.HINDI_DIGIT_WORDS) {
      result = result.replace(regex, digit);
    }

    // Contextual replacement for ambiguous 'do' and 'teen':
    // only if surrounded by digits or digit words
    result = result.replace(/(?<=[0-9\s])do(?=[\s0-9])/gi, '2');
    result = result.replace(/(?<=[0-9\s])teen(?=[\s0-9])/gi, '3');

    return result;
  }

  private static replaceDigitWordsIfCluster(text: string): string {
    // Check if message has multiple digit word occurrences indicating contact attempt
    let matchCount = 0;
    for (const [regex] of this.ENGLISH_DIGIT_WORDS) {
      const m = text.match(regex);
      if (m) matchCount += m.length;
    }
    for (const [regex] of this.HINDI_DIGIT_WORDS) {
      const m = text.match(regex);
      if (m) matchCount += m.length;
    }

    // If 3 or more digit words exist, or 1 digit word adjacent to digits, convert
    if (matchCount >= 3 || (/\d/.test(text) && matchCount >= 1)) {
      return this.normalizeDigitWords(text);
    }

    return text;
  }
}
