import { EmptyTextException } from "../errors.js";
import type { Hyphenator } from "../hyphenation/hyphenator.js";
import { LiangHyphenator } from "../hyphenation/liangHyphenator.js";
import type { Language } from "../language/language.js";
import type { SyllableCounter } from "../syllable/syllableCounter.js";
import type { TextSplitter } from "./textSplitter.js";
import { TextStatistics } from "./textStatistics.js";

/** Sort a histogram map by ascending key. */
function sortedHistogram(histogram: Map<number, number>): Map<number, number> {
  return new Map([...histogram.entries()].sort((a, b) => a[0] - b[0]));
}

/** High-level text analysis: syllable counting plus aggregate metrics. */
export class TextAnalyzer {
  private readonly hyphenator: Hyphenator;
  private readonly syllableCounter: SyllableCounter;
  private readonly textSplitter: TextSplitter;
  private readonly language: Language;

  constructor(
    hyphenator: Hyphenator,
    syllableCounter: SyllableCounter,
    textSplitter: TextSplitter,
    language: Language,
  ) {
    this.hyphenator = hyphenator;
    this.syllableCounter = syllableCounter;
    this.textSplitter = textSplitter;
    this.language = language;
  }

  splitWord(word: string): string[] {
    return this.hyphenator.hyphenate(word);
  }

  splitSyllables(word: string): string[] {
    return this.syllableCounter.splitSyllables(word);
  }

  syllableCount(word: string): number {
    return this.syllableCounter.countSyllables(word);
  }

  wordCount(text: string): number {
    return this.textSplitter.countWords(text);
  }

  sentenceCount(text: string): number {
    return this.textSplitter.countSentences(text);
  }

  letterCount(text: string): number {
    return this.textSplitter.countLetters(text);
  }

  totalSyllables(text: string): number {
    const words = this.textSplitter.splitWords(text);
    let total = 0;
    for (const w of words) {
      total += this.syllableCounter.countSyllables(w);
    }
    return total;
  }

  averageSyllablesPerWord(text: string): number {
    const words = this.textSplitter.splitWords(text);
    const wordCount = words.length;
    if (wordCount === 0) {
      return 0;
    }
    let total = 0;
    for (const w of words) {
      total += this.syllableCounter.countSyllables(w);
    }
    return total / wordCount;
  }

  averageWordsPerSentence(text: string): number {
    const wordCount = this.textSplitter.countWords(text);
    const sentenceCount = this.textSplitter.countSentences(text);
    if (sentenceCount === 0) {
      return wordCount;
    }
    return wordCount / sentenceCount;
  }

  wordsWithMoreThanNSyllables(text: string, n: number, countProperNouns = true): number {
    const words = this.textSplitter.splitWords(text);
    let count = 0;
    for (const word of words) {
      if (this.syllableCounter.countSyllables(word) > n) {
        if (countProperNouns) {
          count += 1;
        } else {
          const firstLetter = Array.from(word)[0]!;
          if (firstLetter !== firstLetter.toUpperCase()) {
            count += 1;
          }
        }
      }
    }
    return count;
  }

  polysyllableCount(text: string, countProperNouns = true): number {
    return this.wordsWithMoreThanNSyllables(text, 2, countProperNouns);
  }

  histogramSyllables(text: string): Map<number, number> {
    const words = this.textSplitter.splitWords(text);
    const histogram = new Map<number, number>();
    for (const word of words) {
      const syllables = this.syllableCounter.countSyllables(word);
      /* c8 ignore next 3 -- defensive: split words are never empty, so count >= 1 */
      if (syllables === 0) {
        continue;
      }
      histogram.set(syllables, (histogram.get(syllables) ?? 0) + 1);
    }
    return sortedHistogram(histogram);
  }

  analyze(text: string): TextStatistics {
    const trimmed = text.trim();
    const words = this.textSplitter.splitWords(trimmed);
    const wordCount = words.length;

    if (wordCount === 0) {
      throw EmptyTextException.create();
    }

    const letterCount = this.textSplitter.countLetters(trimmed);
    const sentenceCount = this.textSplitter.countSentences(trimmed);

    let totalSyllables = 0;
    let polysyllableCount = 0;
    let histogram = new Map<number, number>();

    for (const word of words) {
      const syllables = this.syllableCounter.countSyllables(word);
      totalSyllables += syllables;

      if (syllables > 2) {
        polysyllableCount += 1;
      }

      /* c8 ignore next 3 -- defensive: split words always yield >= 1 syllable */
      if (syllables > 0) {
        histogram.set(syllables, (histogram.get(syllables) ?? 0) + 1);
      }
    }

    /* c8 ignore next 2 -- analyze guarantees >= 1 sentence */
    const sentenceCountForAverage = sentenceCount > 0 ? sentenceCount : 1;

    histogram = sortedHistogram(histogram);

    const lixConfig = this.language.getFormulaConfig("lix");
    let longWordThreshold = 6;
    if (lixConfig !== null) {
      const threshold = lixConfig["longWordThreshold"];
      if (typeof threshold === "number") {
        longWordThreshold = Math.trunc(threshold);
      }
    }

    const longWordCount = this.textSplitter.countLongWords(trimmed, longWordThreshold);

    return new TextStatistics({
      letterCount,
      wordCount,
      sentenceCount,
      syllableCount: totalSyllables,
      polysyllableCount,
      averageSyllablesPerWord: totalSyllables / wordCount,
      averageWordsPerSentence: wordCount / sentenceCountForAverage,
      longWordCount,
      syllableHistogram: histogram,
    });
  }

  addHyphenations(hyphenations: Record<string, string>): void {
    if (this.hyphenator instanceof LiangHyphenator) {
      this.hyphenator.addHyphenations(hyphenations);
    }
  }
}
