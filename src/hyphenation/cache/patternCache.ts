import type { HyphenationExceptionsCollection } from "../hyphenationExceptionsCollection.js";
import type { PatternsCollection } from "../patternsCollection.js";

/** Serialized/deserialized pattern data as stored by a cache. */
export interface CachedPatterns {
  patterns: PatternsCollection;
  exceptions: HyphenationExceptionsCollection;
  maxPatternLength: number;
}

/** A cache for compiled hyphenation patterns. */
export interface PatternCache {
  has(languageCode: string): boolean;
  get(languageCode: string): CachedPatterns | null;
  set(languageCode: string, data: CachedPatterns): void;
  clear(languageCode: string): void;
  clearAll(): void;
}
