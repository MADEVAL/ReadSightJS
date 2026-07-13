import type { HyphenationExceptionsCollection } from "./hyphenationExceptionsCollection.js";
import type { Hyphenator } from "./hyphenator.js";
import type { PatternsCollection } from "./patternsCollection.js";

/**
 * Frank M. Liang (TeX) hyphenation algorithm.
 *
 * Ported byte-for-byte from the canonical PHP library and its Python port.
 * String indexing is done over Unicode code points (via `Array.from`) so that
 * multi-byte scripts behave identically to PHP `mb_*` / Python string slicing.
 */
export class LiangHyphenator implements Hyphenator {
  private readonly patterns: PatternsCollection;
  private readonly exceptions: HyphenationExceptionsCollection;
  private readonly minHyphenLeft: number;
  private readonly minHyphenRight: number;
  private readonly userHyphenations = new Map<string, string>();

  constructor(
    patterns: PatternsCollection,
    exceptions: HyphenationExceptionsCollection,
    minHyphenLeft = 2,
    minHyphenRight = 2,
  ) {
    this.patterns = patterns;
    this.exceptions = exceptions;
    this.minHyphenLeft = minHyphenLeft;
    this.minHyphenRight = minHyphenRight;
  }

  addHyphenations(hyphenations: Record<string, string>): void {
    for (const [word, hyphenated] of Object.entries(hyphenations)) {
      this.userHyphenations.set(word.toLowerCase(), hyphenated.toLowerCase());
    }
  }

  hyphenate(word: string): string[] {
    const wordChars = Array.from(word);
    const wordLength = wordChars.length;

    if (wordLength === 0) {
      return [];
    }

    if (wordLength < this.minHyphenLeft + this.minHyphenRight) {
      return [word];
    }

    const wordLower = word.toLowerCase();

    const userHyphenated = this.userHyphenations.get(wordLower);
    if (userHyphenated !== undefined) {
      return this.splitByHyphenation(userHyphenated, wordChars);
    }

    if (this.exceptions.has(wordLower)) {
      const hyphenated = this.exceptions.get(wordLower);
      if (hyphenated !== null) {
        return this.splitByHyphenation(hyphenated, wordChars);
      }
    }

    return this.splitByPatterns(wordChars, wordLength, wordLower);
  }

  countSyllables(word: string): number {
    const parts = this.hyphenate(word);
    return parts.length;
  }

  private splitByHyphenation(hyphenated: string, originalWordChars: string[]): string[] {
    const parts: string[] = [];
    let part = "";
    let j = 0;
    const hyphenatedChars = Array.from(hyphenated);

    for (const char of hyphenatedChars) {
      if (char === "-") {
        if (part) {
          parts.push(part);
        }
        part = "";
      } else {
        if (j < originalWordChars.length) {
          part += originalWordChars[j];
        }
        j += 1;
      }
    }

    if (part) {
      parts.push(part);
    }

    return parts;
  }

  private splitByPatterns(wordChars: string[], wordLength: number, wordLower: string): string[] {
    const textChars = [".", ...Array.from(wordLower), "."];
    const textLength = wordLength + 2;
    let patternLength = this.patterns.maxLength();

    if (patternLength > textLength) {
      patternLength = textLength;
    }

    const scores = new Map<number, number>();

    const end = textLength - this.minHyphenRight;
    for (let start = 0; start < end; start++) {
      const maxLen = Math.min(patternLength, textLength - start);

      for (let length = 1; length <= maxLen; length++) {
        const subword = textChars.slice(start, start + length).join("");
        const weights = this.patterns.getWeights(subword);

        if (weights === null) {
          continue;
        }

        const weightsLength = weights.length;
        for (let offset = 0; offset < weightsLength; offset++) {
          const idx = start + offset;
          if (idx >= textLength) {
            continue;
          }
          const score = Number(weights[offset]);
          const existing = scores.get(idx);
          if (existing === undefined || score > existing) {
            scores.set(idx, score);
          }
        }
      }
    }

    const parts: string[] = [];
    let part = wordChars.slice(0, this.minHyphenLeft).join("");
    const breakEnd = textLength - this.minHyphenRight;

    let i = this.minHyphenLeft + 1;
    while (i < breakEnd) {
      if ((scores.get(i) ?? 0) & 1) {
        parts.push(part);
        part = "";
      }
      if (i - 1 < wordChars.length) {
        part += wordChars[i - 1];
      }
      i += 1;
    }

    while (i < textLength - 1) {
      if (i - 1 < wordChars.length) {
        part += wordChars[i - 1];
      }
      i += 1;
    }

    if (part) {
      parts.push(part);
    }

    return parts;
  }
}
