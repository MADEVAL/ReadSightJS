import type { Formula } from "../formula.js";
import { FormulaResult } from "../formulaResult.js";
import type { Language } from "../../language/language.js";
import type { TextStatistics } from "../../text/textStatistics.js";
import { phpRound } from "../../internal/phpRound.js";

/** Fernandez-Huerta — Spanish adaptation of Flesch Reading Ease. */
export class FernandezHuerta implements Formula {
  name(): string {
    return "fernandez_huerta";
  }

  description(): string {
    return "Fernandez-Huerta - Spanish adaptation of Flesch Reading Ease.";
  }

  supportedLanguages(): string[] {
    return ["es"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const score =
      206.84 - 1.02 * stats.averageWordsPerSentence - 60.0 * stats.averageSyllablesPerWord;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: null,
      interpretation: FernandezHuerta.interpret(score),
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
      return "Fairly Difficult";
    } else if (score >= 30.0) {
      return "Difficult";
    } else {
      return "Very Difficult";
    }
  }
}

/** Szigriszt-Pazos Perspicuity Index — Spanish readability formula. */
export class SzigrisztPazos implements Formula {
  name(): string {
    return "szigriszt_pazos";
  }

  description(): string {
    return "Szigriszt-Pazos Perspicuity Index - Spanish readability formula.";
  }

  supportedLanguages(): string[] {
    return ["es"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const p = stats.averageWordsPerSentence;

    const syllablesPerWord = stats.syllableCount / wordCount;
    const syllablesPer100 = phpRound(syllablesPerWord * 100.0, 1);
    const score = phpRound(206.835 - 62.3 * syllablesPerWord - p, 1);

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score,
      gradeLevel: null,
      interpretation: SzigrisztPazos.interpret(score),
      inputs: {
        syllablesPer100,
        wordsPerSentence: phpRound(p, 1),
      },
    });
  }

  private static interpret(score: number): string {
    if (score >= 85.0) {
      return "Very Easy";
    } else if (score >= 75.0) {
      return "Easy";
    } else if (score >= 65.0) {
      return "Fairly Easy";
    } else if (score >= 55.0) {
      return "Standard";
    } else if (score >= 40.0) {
      return "Fairly Difficult";
    } else if (score >= 30.0) {
      return "Difficult";
    } else {
      return "Very Difficult";
    }
  }
}

/** Gutierrez de Polini Understandability Index — Spanish elementary education. */
export class GutierrezPolini implements Formula {
  name(): string {
    return "gutierrez_polini";
  }

  description(): string {
    return "Gutierrez de Polini Understandability Index - Spanish readability for elementary education.";
  }

  supportedLanguages(): string[] {
    return ["es"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const score =
      95.2 - 9.7 * (stats.letterCount / wordCount) - 0.35 * stats.averageWordsPerSentence;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: null,
      interpretation: GutierrezPolini.interpret(score),
      inputs: {
        lettersPerWord: phpRound(stats.letterCount / wordCount, 2),
        wordsPerSentence: phpRound(stats.averageWordsPerSentence, 2),
      },
    });
  }

  private static interpret(score: number): string {
    if (score >= 80.0) {
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

/** Crawford Formula — Spanish readability for elementary school texts. */
export class Crawford implements Formula {
  name(): string {
    return "crawford";
  }

  description(): string {
    return "Crawford Formula - Spanish readability for elementary school texts.";
  }

  supportedLanguages(): string[] {
    return ["es"];
  }

  calculate(stats: TextStatistics, language: Language): FormulaResult {
    const wordCount = stats.wordCount > 0 ? stats.wordCount : 1;
    const sentenceCount = stats.sentenceCount > 0 ? stats.sentenceCount : 1;

    const averageLetters = stats.letterCount / wordCount;
    const sentencesPer100 = (sentenceCount / wordCount) * 100.0;
    const score = -0.205 * averageLetters + 0.049 * sentencesPer100 - 3.407;

    return new FormulaResult({
      formulaName: this.name(),
      languageCode: language.code,
      score: phpRound(score, 1),
      gradeLevel: null,
      interpretation: Crawford.interpret(score),
      inputs: {
        avgLettersPerWord: phpRound(averageLetters, 2),
        sentencesPer100Words: phpRound(sentencesPer100, 2),
      },
    });
  }

  private static interpret(score: number): string {
    if (score >= 9.0) {
      return "Very Easy";
    } else if (score >= 7.0) {
      return "Easy";
    } else if (score >= 5.0) {
      return "Standard";
    } else if (score >= 3.0) {
      return "Difficult";
    } else {
      return "Very Difficult";
    }
  }
}
