import type { TextStatistics } from "../text/textStatistics.js";

/** Shared helpers for formulas that estimate difficult-word ratios. */
export class TextStatisticsHelper {
  static estimateDifficultPercentage(stats: TextStatistics): number {
    if (stats.wordCount === 0) {
      return 0;
    }

    const easyWordCount = stats.syllableHistogram.get(1) ?? 0;
    let difficultCount = stats.wordCount - easyWordCount;

    if (difficultCount < 0) {
      difficultCount = 0;
    }

    return (difficultCount / stats.wordCount) * 100.0;
  }
}
