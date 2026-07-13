import type { Formula } from "../formula.js";
import { FormulaResult } from "../formulaResult.js";
import { GradeLevelInterpretation } from "../gradeLevelInterpretation.js";
import type { Language } from "../../language/language.js";
import type { TextStatistics } from "../../text/textStatistics.js";
import { phpRound } from "../../internal/phpRound.js";

/** Gunning Fog Index — estimates years of education needed to understand text. */
export class GunningFog implements Formula {
  name(): string {
    return "gunning_fog";
  }

  description(): string {
    return "Gunning Fog Index - estimates years of education needed to understand text.";
  }

  supportedLanguages(): string[] {
    return ["*"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const polysyllablePct =
      stats.wordCount > 0 ? (stats.polysyllableCount / stats.wordCount) * 100.0 : 0.0;
    const score = 0.4 * (stats.averageWordsPerSentence + polysyllablePct);

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 19.0),
      interpretation: GunningFog.interpret(score),
      inputs: {
        asl: stats.averageWordsPerSentence,
        polysyllablePct,
        polysyllableCount: stats.polysyllableCount,
        wordCount: stats.wordCount,
      },
    });
  }

  private static interpret(score: number): string {
    if (score < 6.0) {
      return "Very Easy";
    } else if (score < 8.0) {
      return "Easy";
    } else if (score < 12.0) {
      return "Standard";
    } else if (score < 14.0) {
      return "Hard";
    } else if (score < 17.0) {
      return "Very Hard";
    } else {
      return "Extremely Hard";
    }
  }
}

/** SMOG Index — Simple Measure of Gobbledygook. */
export class SmogIndex implements Formula {
  name(): string {
    return "smog";
  }

  description(): string {
    return "SMOG Index - Simple Measure of Gobbledygook. Estimates years of education needed.";
  }

  supportedLanguages(): string[] {
    return ["*"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const sentenceCount = stats.sentenceCount > 0 ? stats.sentenceCount : 1;
    const score = 1.043 * Math.sqrt(stats.polysyllableCount * (30.0 / sentenceCount)) + 3.1291;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 18.0),
      interpretation: GradeLevelInterpretation.forScore(score),
      inputs: {
        polysyllableCount: stats.polysyllableCount,
        sentenceCount: stats.sentenceCount,
      },
    });
  }
}

/** Coleman-Liau Index — character-based readability formula. */
export class ColemanLiau implements Formula {
  name(): string {
    return "coleman_liau";
  }

  description(): string {
    return "Coleman-Liau Index - character-based readability formula (no syllable counting needed).";
  }

  supportedLanguages(): string[] {
    return ["*"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const sentenceCount = stats.sentenceCount > 0 ? stats.sentenceCount : 1;

    const l = (stats.letterCount / wordCount) * 100.0;
    const s = (sentenceCount / wordCount) * 100.0;
    const score = 0.0588 * l - 0.296 * s - 15.8;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 18.0),
      interpretation: GradeLevelInterpretation.forScore(score),
      inputs: {
        L: phpRound(l, 2),
        S: phpRound(s, 2),
        letterCount: stats.letterCount,
        wordCount: stats.wordCount,
        sentenceCount: stats.sentenceCount,
      },
    });
  }
}

/** Automated Readability Index — character-based formula. */
export class AutomatedReadabilityIndex implements Formula {
  name(): string {
    return "ari";
  }

  description(): string {
    return "Automated Readability Index - character-based formula. Works for all alphabetic languages.";
  }

  supportedLanguages(): string[] {
    return ["*"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const sentenceCount = stats.sentenceCount > 0 ? stats.sentenceCount : 1;

    const score =
      4.71 * (stats.letterCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 18.0),
      interpretation: GradeLevelInterpretation.forScore(score),
      inputs: {
        charsPerWord: phpRound(stats.letterCount / wordCount, 2),
        wordsPerSentence: phpRound(wordCount / sentenceCount, 2),
      },
    });
  }
}

/** LIX (Läsbarhetsindex) — Scandinavian readability formula. */
export class Lix implements Formula {
  name(): string {
    return "lix";
  }

  description(): string {
    return "LIX (Läsbarhetsindex) - Scandinavian readability formula. Language-independent, uses letter count.";
  }

  supportedLanguages(): string[] {
    return ["*"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const config = language.getFormulaConfig(this.name());
    let threshold = 6;
    if (config !== null) {
      const t = config["longWordThreshold"];
      if (typeof t === "number") {
        threshold = Math.trunc(t);
      }
    }

    const longWordPct = stats.wordCount > 0 ? (stats.longWordCount / stats.wordCount) * 100.0 : 0.0;
    const score = stats.averageWordsPerSentence + longWordPct;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 2),
      gradeLevel: null,
      interpretation: Lix.interpret(score),
      inputs: {
        asl: stats.averageWordsPerSentence,
        longWordPct: phpRound(longWordPct, 2),
        threshold,
        longWordCount: stats.longWordCount,
        wordCount: stats.wordCount,
      },
    });
  }

  private static interpret(score: number): string {
    if (score < 25.0) {
      return "Children's Books";
    } else if (score < 30.0) {
      return "Simple Texts";
    } else if (score < 40.0) {
      return "Normal / Fiction";
    } else if (score < 50.0) {
      return "Factual Information";
    } else if (score < 60.0) {
      return "Specialized Texts";
    } else {
      return "Research / Advanced";
    }
  }
}
