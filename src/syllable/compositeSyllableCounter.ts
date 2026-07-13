import { HeuristicSyllableCounter } from "./heuristicSyllableCounter.js";
import type { SyllableCounter } from "./syllableCounter.js";

/**
 * Chains syllable counters: use the heuristic counter when it has rules,
 * otherwise fall back to the next counter (typically TeX).
 */
export class CompositeSyllableCounter implements SyllableCounter {
  private readonly chain: SyllableCounter[];

  constructor(chain: SyllableCounter[]) {
    this.chain = chain;
  }

  countSyllables(word: string): number {
    for (const counter of this.chain) {
      if (counter instanceof HeuristicSyllableCounter) {
        if (counter.hasRules()) {
          return counter.countSyllables(word);
        }
        continue;
      }
      return counter.countSyllables(word);
    }

    const last = this.chain[this.chain.length - 1];
    return last ? last.countSyllables(word) : 1;
  }

  splitSyllables(word: string): string[] {
    for (const counter of this.chain) {
      if (counter instanceof HeuristicSyllableCounter) {
        if (counter.hasRules()) {
          return counter.splitSyllables(word);
        }
        continue;
      }
      return counter.splitSyllables(word);
    }

    const last = this.chain[this.chain.length - 1];
    return last ? last.splitSyllables(word) : [word];
  }
}
