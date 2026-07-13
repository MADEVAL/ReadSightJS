import { Pattern } from "./pattern.js";

/** Collection of TeX hyphenation patterns, keyed by their character string. */
export class PatternsCollection {
  private readonly patterns = new Map<string, string>();
  private maxPatternLength = 0;

  add(pattern: Pattern): void {
    const key = pattern.chars.join("");
    const weights = pattern.weights.join("");
    this.patterns.set(key, weights);
    if (pattern.length > this.maxPatternLength) {
      this.maxPatternLength = pattern.length;
    }
  }

  all(): Record<string, string> {
    return Object.fromEntries(this.patterns);
  }

  getWeights(subword: string): string | null {
    return this.patterns.get(subword) ?? null;
  }

  count(): number {
    return this.patterns.size;
  }

  maxLength(): number {
    return this.maxPatternLength;
  }

  isEmpty(): boolean {
    return this.patterns.size === 0;
  }
}
