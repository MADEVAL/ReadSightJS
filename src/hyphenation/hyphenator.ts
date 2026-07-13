/** Splits words into syllable-like parts and counts them. */
export interface Hyphenator {
  /** Split a word into syllable parts. */
  hyphenate(word: string): string[];
  /** Count the number of syllables in a word. */
  countSyllables(word: string): number;
}
