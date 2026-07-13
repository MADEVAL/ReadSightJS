import type { Hyphenator } from "../hyphenation/hyphenator.js";
import type { SyllableCounter } from "./syllableCounter.js";

/** Syllable counter backed by the TeX (Liang) hyphenator. */
export class TexSyllableCounter implements SyllableCounter {
  private readonly hyphenator: Hyphenator;

  constructor(hyphenator: Hyphenator) {
    this.hyphenator = hyphenator;
  }

  countSyllables(word: string): number {
    return this.hyphenator.countSyllables(word);
  }

  splitSyllables(word: string): string[] {
    return this.hyphenator.hyphenate(word);
  }
}
