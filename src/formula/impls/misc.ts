import type { Formula } from "../formula.js";
import { FormulaResult } from "../formulaResult.js";
import { TextStatisticsHelper } from "../textStatisticsHelper.js";
import type { Language } from "../../language/language.js";
import type { TextStatistics } from "../../text/textStatistics.js";
import { phpRound } from "../../internal/phpRound.js";

/** Gulpease Index — Italian readability formula using letter count. */
export class Gulpease implements Formula {
  name(): string {
    return "gulpease";
  }

  description(): string {
    return "Gulpease Index - Italian readability formula. Uses letter count instead of syllables.";
  }

  supportedLanguages(): string[] {
    return ["it"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const score = 89.0 + (300.0 * stats.sentenceCount - 10.0 * stats.letterCount) / wordCount;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: null,
      interpretation: Gulpease.interpret(score),
      inputs: {
        letterCount: stats.letterCount,
        wordCount: stats.wordCount,
        sentenceCount: stats.sentenceCount,
      },
    });
  }

  private static interpret(score: number): string {
    if (score >= 80.0) {
      return "Easy for elementary school";
    } else if (score >= 60.0) {
      return "Easy for middle school";
    } else if (score >= 40.0) {
      return "Easy for high school";
    } else {
      return "Difficult for high school";
    }
  }
}

/** FOG-PL — Polish adaptation of the Gunning Fog Index. */
export class FogPL implements Formula {
  name(): string {
    return "fog_pl";
  }

  description(): string {
    return "FOG-PL - Polish adaptation of Gunning Fog Index.";
  }

  supportedLanguages(): string[] {
    return ["pl"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const sentenceCount = stats.sentenceCount > 0 ? stats.sentenceCount : 1;

    const hardWordsPct = (stats.polysyllableCount / wordCount) * 100.0;
    const asl = wordCount / sentenceCount;
    const score = 0.4 * (asl + hardWordsPct);

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 19.0),
      interpretation: FogPL.interpret(score),
      inputs: {
        asl: phpRound(asl, 2),
        hardWordsPct: phpRound(hardWordsPct, 2),
        polysyllableCount: stats.polysyllableCount,
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
    } else {
      return "Very Hard";
    }
  }
}

/** Dale-Chall Readability Score — estimates difficult words via syllable heuristic. */
export class DaleChall implements Formula {
  name(): string {
    return "dale_chall";
  }

  description(): string {
    return "Dale-Chall Readability Score - estimates difficult words via syllable heuristic (1-syllable = easy).";
  }

  supportedLanguages(): string[] {
    return ["en-us", "en-gb"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const difficultPct = TextStatisticsHelper.estimateDifficultPercentage(stats);
    const rawScore = 0.1579 * difficultPct + 0.0496 * stats.averageWordsPerSentence;
    const adjusted = difficultPct > 5.0 ? rawScore + 3.6365 : rawScore;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(adjusted, 1),
      gradeLevel: null,
      interpretation: DaleChall.interpret(adjusted),
      inputs: {
        difficultWordPct: phpRound(difficultPct, 1),
        rawScore: phpRound(rawScore, 4),
        averageWordsPerSentence: stats.averageWordsPerSentence,
      },
    });
  }

  private static interpret(score: number): string {
    if (score <= 4.9) {
      return "4th grade or below";
    } else if (score <= 5.9) {
      return "5th-6th grade";
    } else if (score <= 6.9) {
      return "7th-8th grade";
    } else if (score <= 7.9) {
      return "9th-10th grade";
    } else if (score <= 8.9) {
      return "11th-12th grade";
    } else if (score <= 9.9) {
      return "College";
    } else {
      return "Graduate";
    }
  }
}

/** Spache Readability Score — for primary-grade texts (K-4). */
export class Spache implements Formula {
  name(): string {
    return "spache";
  }

  description(): string {
    return "Spache Readability Score - for primary-grade texts (K-4).";
  }

  supportedLanguages(): string[] {
    return ["en-us", "en-gb"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const difficultPct = TextStatisticsHelper.estimateDifficultPercentage(stats);
    const score = 0.121 * stats.averageWordsPerSentence + 0.082 * difficultPct + 0.659;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 5.0),
      interpretation: Spache.interpret(score),
      inputs: {
        averageWordsPerSentence: stats.averageWordsPerSentence,
        difficultWordPct: phpRound(difficultPct, 2),
      },
    });
  }

  private static interpret(score: number): string {
    if (score <= 2.0) {
      return "1st Grade";
    } else if (score <= 2.5) {
      return "2nd Grade";
    } else if (score <= 3.0) {
      return "3rd Grade";
    } else if (score <= 3.5) {
      return "4th Grade";
    } else {
      return "Above 4th Grade";
    }
  }
}

/** OSMAN — Arabic readability formula combining Flesch and Fog adaptations. */
export class Osman implements Formula {
  name(): string {
    return "osman";
  }

  description(): string {
    return "OSMAN - Arabic readability formula combining Flesch and Fog adaptations.";
  }

  supportedLanguages(): string[] {
    return ["ar"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const sentenceCount = stats.sentenceCount > 0 ? stats.sentenceCount : 1;

    const asl = wordCount / sentenceCount;
    const avgLetters = stats.letterCount / wordCount;
    const hardWordsPct = (stats.polysyllableCount / wordCount) * 100.0;
    const score = 200.0 - 2.0 * asl - 1.5 * avgLetters - 0.4 * hardWordsPct;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: null,
      interpretation: Osman.interpret(score),
      inputs: {
        asl: phpRound(asl, 2),
        avgLetters: phpRound(avgLetters, 2),
        hardWordsPct: phpRound(hardWordsPct, 2),
      },
    });
  }

  private static interpret(score: number): string {
    if (score >= 90.0) {
      return "Very Easy";
    } else if (score >= 70.0) {
      return "Easy";
    } else if (score >= 50.0) {
      return "Standard";
    } else if (score >= 30.0) {
      return "Difficult";
    } else {
      return "Very Difficult";
    }
  }
}
