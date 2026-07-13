import { HyphenationOverride } from "./hyphenationOverride.js";

/** Collection of explicit hyphenation overrides, keyed by the plain word. */
export class HyphenationExceptionsCollection {
  private readonly exceptions = new Map<string, string>();

  add(exception: HyphenationOverride): void {
    this.exceptions.set(exception.word, exception.hyphenated);
  }

  has(word: string): boolean {
    return this.exceptions.has(word);
  }

  get(word: string): string | null {
    return this.exceptions.get(word) ?? null;
  }

  count(): number {
    return this.exceptions.size;
  }

  isEmpty(): boolean {
    return this.exceptions.size === 0;
  }

  all(): Record<string, string> {
    return Object.fromEntries(this.exceptions);
  }
}
