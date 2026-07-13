import type { Formula } from "../formula.js";
import { FormulaResult } from "../formulaResult.js";
import type { Language } from "../../language/language.js";
import type { TextStatistics } from "../../text/textStatistics.js";
import { phpRound } from "../../internal/phpRound.js";

const FLESCH_LANGUAGES = [
  "en-us",
  "en-gb",
  "de-1996",
  "de-1901",
  "de-ch-1901",
  "ru",
  "es",
  "it",
  "fr",
  "nl",
  "pt",
  "tr",
];

/** Flesch Reading Ease — 0–100 scale (higher = easier), coefficients per language. */
export class FleschReadingEase implements Formula {
  name(): string {
    return "flesch_reading_ease";
  }

  description(): string {
    return (
      "Flesch Reading Ease - measures text readability on a 0-100 scale " +
      "(higher = easier). Coefficients vary by language."
    );
  }

  supportedLanguages(): string[] {
    return [...FLESCH_LANGUAGES];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const config = language.getFormulaConfig(this.name()) ?? {};

    let base = 206.835;
    let asl = 1.015;
    let asw = 84.6;

    if (typeof config["base"] === "number") {
      base = config["base"];
    }
    if (typeof config["aslMult"] === "number") {
      asl = config["aslMult"];
    }
    if (typeof config["aswMult"] === "number") {
      asw = config["aswMult"];
    }

    const score = base - asl * stats.averageWordsPerSentence - asw * stats.averageSyllablesPerWord;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: null,
      interpretation: FleschReadingEase.interpret(score),
      inputs: {
        asl: stats.averageWordsPerSentence,
        asw: stats.averageSyllablesPerWord,
      },
    });
  }

  private static interpret(score: number): string {
    if (score >= 90.0) {
      return "Very Easy";
    } else if (score >= 80.0) {
      return "Easy";
    } else if (score >= 70.0) {
      return "Fairly Easy";
    } else if (score >= 60.0) {
      return "Standard";
    } else if (score >= 50.0) {
      return "Fairly Hard";
    } else if (score >= 30.0) {
      return "Hard";
    } else {
      return "Very Hard";
    }
  }
}

/** Flesch-Kincaid Grade Level — converts Reading Ease into a US school grade. */
export class FleschKincaidGradeLevel implements Formula {
  name(): string {
    return "flesch_kincaid_grade_level";
  }

  description(): string {
    return "Flesch-Kincaid Grade Level - converts Reading Ease into a U.S. school grade level.";
  }

  supportedLanguages(): string[] {
    return [...FLESCH_LANGUAGES];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const score =
      0.39 * stats.averageWordsPerSentence + 11.8 * stats.averageSyllablesPerWord - 15.59;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: Math.min(Math.max(phpRound(score, 1), 0.0), 18.0),
      interpretation: FleschKincaidGradeLevel.interpret(score),
      inputs: {
        asl: stats.averageWordsPerSentence,
        asw: stats.averageSyllablesPerWord,
      },
    });
  }

  private static interpret(score: number): string {
    if (score <= 1.0) {
      return "1st Grade";
    } else if (score <= 2.0) {
      return "2nd Grade";
    } else if (score <= 3.0) {
      return "3rd Grade";
    } else if (score <= 4.0) {
      return "4th Grade";
    } else if (score <= 5.0) {
      return "5th Grade";
    } else if (score <= 6.0) {
      return "6th Grade";
    } else if (score <= 7.0) {
      return "7th Grade";
    } else if (score <= 8.0) {
      return "8th Grade";
    } else if (score <= 9.0) {
      return "9th Grade";
    } else if (score <= 10.0) {
      return "10th Grade";
    } else if (score <= 11.0) {
      return "11th Grade";
    } else if (score <= 12.0) {
      return "12th Grade";
    } else if (score <= 16.0) {
      return "College";
    } else {
      return "Graduate";
    }
  }
}
