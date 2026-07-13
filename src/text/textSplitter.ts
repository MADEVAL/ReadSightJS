import type { Language } from "../language/language.js";

/** Splits text into words/sentences and counts letters via language regexes. */
export class TextSplitter {
  private readonly letterPattern: RegExp;
  private readonly sentenceBoundaryPattern: RegExp;
  private readonly wordSplitPattern: RegExp;

  constructor(language: Language) {
    this.letterPattern = new RegExp(language.letterPattern, "gu");
    this.sentenceBoundaryPattern = new RegExp(language.sentenceBoundaryPattern, "gu");
    this.wordSplitPattern = new RegExp(language.wordSplitPattern, "u");
  }

  splitWords(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }

    const parts = trimmed.split(this.wordSplitPattern);
    return parts.filter((w) => w !== "" && w !== undefined);
  }

  splitSentences(text: string): string[] {
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }

    const boundary = new RegExp(this.sentenceBoundaryPattern.source, "u");
    const parts = trimmed.split(boundary);
    return parts.map((p) => p.trim()).filter((p) => p !== "");
  }

  countLetters(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) {
      return 0;
    }

    return this.countMatches(this.letterPattern, trimmed);
  }

  countWords(text: string): number {
    return this.splitWords(text).length;
  }

  countSentences(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) {
      return 0;
    }

    const count = this.countMatches(this.sentenceBoundaryPattern, trimmed);
    return count > 0 ? count : 1;
  }

  countLongWords(text: string, threshold: number): number {
    const words = this.splitWords(text);
    let count = 0;
    for (const word of words) {
      if (this.countLetters(word) > threshold) {
        count += 1;
      }
    }
    return count;
  }

  private countMatches(pattern: RegExp, text: string): number {
    pattern.lastIndex = 0;
    let count = 0;
    while (pattern.exec(text) !== null) {
      count += 1;
    }
    return count;
  }
}
