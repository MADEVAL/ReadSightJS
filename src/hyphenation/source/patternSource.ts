import type { HyphenationExceptionsCollection } from "../hyphenationExceptionsCollection.js";
import type { PatternsCollection } from "../patternsCollection.js";

/** Parsed TeX pattern data. */
export interface LoadedPatterns {
  patterns: PatternsCollection;
  exceptions: HyphenationExceptionsCollection;
  maxPatternLength: number;
}

/** A source of TeX hyphenation patterns. */
export interface PatternSource {
  load(): LoadedPatterns;
}
