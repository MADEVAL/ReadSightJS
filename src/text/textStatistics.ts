/** Aggregate statistics computed from a text. */
export class TextStatistics {
  readonly letterCount: number;
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly syllableCount: number;
  readonly polysyllableCount: number;
  readonly averageSyllablesPerWord: number;
  readonly averageWordsPerSentence: number;
  readonly longWordCount: number;
  readonly syllableHistogram: Map<number, number>;

  constructor(params: {
    letterCount: number;
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    polysyllableCount: number;
    averageSyllablesPerWord: number;
    averageWordsPerSentence: number;
    longWordCount: number;
    syllableHistogram: Map<number, number>;
  }) {
    this.letterCount = params.letterCount;
    this.wordCount = params.wordCount;
    this.sentenceCount = params.sentenceCount;
    this.syllableCount = params.syllableCount;
    this.polysyllableCount = params.polysyllableCount;
    this.averageSyllablesPerWord = params.averageSyllablesPerWord;
    this.averageWordsPerSentence = params.averageWordsPerSentence;
    this.longWordCount = params.longWordCount;
    this.syllableHistogram = params.syllableHistogram;
  }
}
