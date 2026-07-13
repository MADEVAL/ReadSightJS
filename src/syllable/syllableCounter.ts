/** Counts and splits syllables using a language-specific strategy. */
export interface SyllableCounter {
  countSyllables(word: string): number;
  splitSyllables(word: string): string[];
}
