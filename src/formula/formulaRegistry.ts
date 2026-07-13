import { UnsupportedFormulaException } from "../errors.js";
import type { Language } from "../language/language.js";
import type { TextStatistics } from "../text/textStatistics.js";
import type { Formula } from "./formula.js";
import type { FormulaResult } from "./formulaResult.js";

/** Registry of readability formulas keyed by name. */
export class FormulaRegistry {
  private readonly formulas = new Map<string, Formula>();

  register(formula: Formula): void {
    this.formulas.set(formula.name(), formula);
  }

  has(name: string): boolean {
    return this.formulas.has(name);
  }

  get(name: string): Formula | null {
    return this.formulas.get(name) ?? null;
  }

  listNames(): string[] {
    return [...this.formulas.keys()];
  }

  listForLanguage(language: Language): string[] {
    const result: string[] = [];
    for (const [name, formula] of this.formulas) {
      const langs = formula.supportedLanguages();
      if (FormulaRegistry.isWildcard(langs) || langs.includes(language.code)) {
        result.push(name);
      }
    }
    return result;
  }

  calculate(name: string, language: Language, stats: TextStatistics): FormulaResult {
    const formula = this.formulas.get(name);
    if (formula === undefined || !FormulaRegistry.isSupportedForLanguage(formula, language)) {
      throw UnsupportedFormulaException.forLanguage(name, language.code);
    }
    return formula.calculate(stats, language);
  }

  private static isSupportedForLanguage(formula: Formula, language: Language): boolean {
    const langs = formula.supportedLanguages();
    if (FormulaRegistry.isWildcard(langs)) {
      return true;
    }
    return langs.includes(language.code);
  }

  private static isWildcard(langs: string[]): boolean {
    return langs.length === 1 && langs[0] === "*";
  }
}
