/** A single word-to-hyphenation override (e.g. "associate" -> "as-so-ci-ate"). */
export class HyphenationOverride {
  readonly word: string;
  readonly hyphenated: string;

  constructor(word: string, hyphenated: string) {
    this.word = word;
    this.hyphenated = hyphenated;
  }
}
