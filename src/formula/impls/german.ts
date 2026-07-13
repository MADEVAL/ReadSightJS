import type { Formula } from "../formula.js";
import { FormulaResult } from "../formulaResult.js";
import type { Language } from "../../language/language.js";
import type { TextStatistics } from "../../text/textStatistics.js";
import { phpRound } from "../../internal/phpRound.js";

interface ComputeResult {
  score: number;
  gradeLevel: number;
  inputs: Record<string, number>;
}

/** Wiener Sachtextformel — German readability formula with 4 variants. */
export class WienerSachtextformel implements Formula {
  name(): string {
    return "wiener_sachtextformel";
  }

  description(): string {
    return "Wiener Sachtextformel - German readability formula with 4 variants.";
  }

  supportedLanguages(): string[] {
    return ["de-1996", "de-1901", "de-ch-1901"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    return this.calculateVariant(stats, language, 1);
  }

  calculateVariant(stats: TextStatistics, language: Language, variant: number): FormulaResult {
    const data = this.compute(variant, stats);
    return new FormulaResult({
      formulaName: `${this.name()}_${variant}`,
      languageCode: language.code,
      score: data.score,
      gradeLevel: data.gradeLevel,
      interpretation: WienerSachtextformel.interpret(data.score),
      inputs: data.inputs,
    });
  }

  private compute(variant: number, stats: TextStatistics): ComputeResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;

    const ms = (stats.polysyllableCount / wordCount) * 100.0;
    const sl = stats.averageWordsPerSentence;
    const iw = WienerSachtextformel.longWordPct(stats);
    let es = 0.0;
    let score: number;

    if (variant === 1) {
      es = WienerSachtextformel.oneSyllablePct(stats);
      score = 0.1935 * ms + 0.1672 * sl + 0.1297 * iw - 0.0327 * es - 0.875;
    } else if (variant === 2) {
      score = 0.2007 * ms + 0.1682 * sl + 0.1373 * iw - 2.779;
    } else if (variant === 3) {
      score = 0.2963 * ms + 0.1905 * sl - 1.1144;
    } else if (variant === 4) {
      score = 0.2744 * ms + 0.2656 * sl - 1.693;
    } else {
      throw new RangeError(`Wiener Sachtextformel variant must be 1-4, got ${variant}.`);
    }

    const gradeLevel = Math.min(Math.max(score, 4.0), 15.0);

    return {
      score: phpRound(score, 1),
      gradeLevel,
      inputs: { ms, sl, iw, es, variant },
    };
  }

  private static longWordPct(stats: TextStatistics): number {
    return stats.wordCount > 0 ? (stats.longWordCount / stats.wordCount) * 100.0 : 0.0;
  }

  private static oneSyllablePct(stats: TextStatistics): number {
    const oneSyllable = stats.syllableHistogram.get(1) ?? 0;
    return stats.wordCount > 0 ? (oneSyllable / stats.wordCount) * 100.0 : 0.0;
  }

  private static interpret(score: number): string {
    if (score < 5.0) {
      return "Very Easy";
    } else if (score < 7.0) {
      return "Easy";
    } else if (score < 9.0) {
      return "Standard";
    } else if (score < 11.0) {
      return "Fairly Hard";
    } else if (score < 13.0) {
      return "Hard";
    } else {
      return "Very Hard";
    }
  }
}
