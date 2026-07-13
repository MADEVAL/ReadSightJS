import type { SyllableHeuristics } from "../language/language.js";
import type { SyllableCounter } from "./syllableCounter.js";

/** Escape a string for safe use inside a regex character class. */
function escapeForCharClass(value: string): string {
  return value.replace(/[\\\]^-]/g, "\\$&");
}

/**
 * Heuristic syllable counter: vowel patterns + word list + affix rules.
 *
 * Ported from the Python reference. Non-word stripping uses Unicode-aware
 * matching (`\p{L}\p{N}_`) to match Python's `re.UNICODE` `\w` semantics for
 * Cyrillic and other scripts. Subtract/add patterns are only ever configured
 * for English (ASCII), so they are compiled without the `u` flag exactly as
 * Python's default `re` engine treats them.
 */
export class HeuristicSyllableCounter implements SyllableCounter {
  private readonly config: SyllableHeuristics | null;
  private readonly problemWords: Record<string, number>;
  private readonly subtractPatterns: string[];
  private readonly addPatterns: string[];
  private readonly prefixes: Record<string, number>;
  private readonly suffixes: Record<string, number>;
  private readonly vowelChars: string;
  private readonly vowelMode: "cluster" | "individual";

  private static readonly NON_WORD = /[^\p{L}\p{N}_]/gu;

  constructor(config: SyllableHeuristics | null) {
    this.config = config;

    if (config !== null) {
      this.problemWords = config.problemWords ?? {};
      this.subtractPatterns = config.subtractPatterns ?? [];
      this.addPatterns = config.addPatterns ?? [];
      this.prefixes = config.prefixes ?? {};
      this.suffixes = config.suffixes ?? {};

      const vowelRaw = config.vowelPattern;
      const vowelPattern = typeof vowelRaw === "string" ? vowelRaw : "[aeiouy]";
      this.vowelChars = vowelPattern.replace(/^\[+/, "").replace(/\]+$/, "");

      this.vowelMode = config.vowelMode === "individual" ? "individual" : "cluster";
    } else {
      this.problemWords = {};
      this.subtractPatterns = [];
      this.addPatterns = [];
      this.prefixes = {};
      this.suffixes = {};
      this.vowelChars = "aeiouy";
      this.vowelMode = "cluster";
    }
  }

  countSyllables(word: string): number {
    const trimmed = word.trim();
    if (!trimmed) {
      return 0;
    }

    const lower = trimmed.toLowerCase();

    if (lower in this.problemWords) {
      return this.problemWords[lower]!;
    }

    const cleanRaw = lower.replace(HeuristicSyllableCounter.NON_WORD, "");
    if (!cleanRaw) {
      return 1;
    }

    let clean = cleanRaw;
    let affixSyllables = 0;

    for (const [prefix, sylCount] of Object.entries(this.prefixes)) {
      if (clean.startsWith(prefix)) {
        clean = clean.slice(prefix.length);
        affixSyllables += sylCount;
      }
    }

    for (const [suffix, sylCount] of Object.entries(this.suffixes)) {
      if (clean.endsWith(suffix)) {
        clean = clean.slice(0, clean.length - suffix.length);
        affixSyllables += sylCount;
      }
    }

    const splitRe = new RegExp(`[^${escapeForCharClass(this.vowelChars)}]+`);
    const vowelParts = clean.split(splitRe);
    let vowelRunCount: number;
    if (this.vowelMode === "individual") {
      vowelRunCount = vowelParts.reduce((sum, part) => sum + (part ? part.length : 0), 0);
    } else {
      vowelRunCount = vowelParts.filter((part) => part).length;
    }

    let count = vowelRunCount + affixSyllables;

    for (const pattern of this.subtractPatterns) {
      count -= this.countMatches(pattern, clean);
    }

    for (const pattern of this.addPatterns) {
      count += this.countMatches(pattern, clean);
    }

    return Math.max(count, 1);
  }

  hasRules(): boolean {
    return (
      this.config !== null &&
      (Object.keys(this.problemWords).length > 0 ||
        this.subtractPatterns.length > 0 ||
        this.addPatterns.length > 0 ||
        Object.keys(this.prefixes).length > 0 ||
        Object.keys(this.suffixes).length > 0 ||
        this.vowelMode === "individual")
    );
  }

  hasWord(word: string): boolean {
    const trimmed = word.trim();
    if (!trimmed) {
      return false;
    }
    return trimmed.toLowerCase() in this.problemWords;
  }

  splitSyllables(word: string): string[] {
    const syllableCount = this.countSyllables(word);

    if (syllableCount <= 1) {
      return word ? [word] : [];
    }

    const wordChars = Array.from(word);
    const length = wordChars.length;
    if (syllableCount >= length) {
      return wordChars;
    }

    const partLen = Math.floor(length / syllableCount);
    const extra = length % syllableCount;
    const parts: string[] = [];
    let pos = 0;

    for (let i = 0; i < syllableCount; i++) {
      let curLen = partLen + (i < extra ? 1 : 0);
      /* c8 ignore next 3 -- defensive: equal-width split never exceeds length */
      if (pos + curLen > length) {
        curLen = length - pos;
      }
      parts.push(wordChars.slice(pos, pos + curLen).join(""));
      pos += curLen;
    }

    return parts;
  }

  private countMatches(pattern: string, clean: string): number {
    const re = new RegExp(pattern, "g");
    const matches = clean.match(re);
    return matches === null ? 0 : matches.length;
  }
}
