import type { Language } from "../language/language.js";
import type { TextStatistics } from "../text/textStatistics.js";
import type { FormulaResult } from "./formulaResult.js";

/** A readability formula. */
export interface Formula {
  name(): string;
  description(): string;
  supportedLanguages(): string[];
  calculate(stats: TextStatistics, language: Language): FormulaResult;
}
