/**
 * ReadSight — multilingual readability library.
 *
 * 86 languages, 17 readability formulas, TeX-based syllable counting via the
 * Frank M. Liang hyphenation algorithm. Zero runtime dependencies.
 */

export { ReadSight, Engine } from "./engine.js";
export { Config } from "./config.js";
export { Language } from "./language/language.js";
export type { LanguageData, FormulaConfig, SyllableHeuristics } from "./language/language.js";
export { LanguageCode } from "./language/languageCode.js";
export { Script } from "./language/script.js";
export { TextStatistics } from "./text/textStatistics.js";
export { FormulaResult } from "./formula/formulaResult.js";
export type { Formula } from "./formula/formula.js";
export { FormulaRegistry } from "./formula/formulaRegistry.js";
export { FormulaRegistryFactory } from "./formula/formulaRegistryFactory.js";
export type { Hyphenator } from "./hyphenation/hyphenator.js";
export {
  ReadabilityEngineException,
  EmptyTextException,
  UnsupportedFormulaException,
  UnsupportedLanguageException,
  PatternFileNotFoundException,
  PatternParseException,
} from "./errors.js";

export const VERSION = "1.0.0";
