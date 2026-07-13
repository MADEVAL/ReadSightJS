/** A single TeX hyphenation pattern: characters plus interleaved weights. */
export class Pattern {
  readonly chars: string[];
  readonly weights: number[];
  readonly length: number;

  constructor(chars: string[], weights: number[]) {
    this.chars = chars;
    this.weights = weights;
    this.length = chars.length;
  }
}
