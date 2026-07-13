import { Config } from "./config.js";
import { UnsupportedFormulaException } from "./errors.js";
import { FormulaRegistry } from "./formula/formulaRegistry.js";
import { FormulaRegistryFactory } from "./formula/formulaRegistryFactory.js";
import type { FormulaResult } from "./formula/formulaResult.js";
import { WienerSachtextformel } from "./formula/impls/german.js";
import { JsonPatternCache } from "./hyphenation/cache/jsonPatternCache.js";
import type { Hyphenator } from "./hyphenation/hyphenator.js";
import { LiangHyphenator } from "./hyphenation/liangHyphenator.js";
import { TexSource } from "./hyphenation/source/texSource.js";
import { JsonLanguageRepository } from "./language/jsonLanguageRepository.js";
import type { Language } from "./language/language.js";
import { CompositeSyllableCounter } from "./syllable/compositeSyllableCounter.js";
import { HeuristicSyllableCounter } from "./syllable/heuristicSyllableCounter.js";
import type { SyllableCounter } from "./syllable/syllableCounter.js";
import { TexSyllableCounter } from "./syllable/texSyllableCounter.js";
import { TextAnalyzer } from "./text/textAnalyzer.js";
import { TextSplitter } from "./text/textSplitter.js";
import type { TextStatistics } from "./text/textStatistics.js";

/**
 * ReadSight — multilingual readability engine facade.
 *
 * Byte-accurate Node.js port of the canonical PHP library and its Python port.
 */
export class ReadSight {
  private static defaultConfig: Config | null = null;

  private readonly language: Language;
  private readonly hyphenator: Hyphenator;
  private readonly syllableCounter: SyllableCounter;
  private readonly text: TextAnalyzer;
  private readonly formulaRegistry: FormulaRegistry;

  constructor(language: string, patternsDir?: string, languagesDir?: string, cacheDir?: string) {
    const config = ReadSight.resolveConfig(patternsDir, languagesDir, cacheDir);

    const languageRepository = new JsonLanguageRepository(config.languagesDir);
    this.language = languageRepository.find(language);

    this.hyphenator = ReadSight.loadHyphenator(this.language, config.patternsDir, config.cacheDir);
    this.syllableCounter = this.loadSyllableCounter();
    const textSplitter = new TextSplitter(this.language);

    this.text = new TextAnalyzer(
      this.hyphenator,
      this.syllableCounter,
      textSplitter,
      this.language,
    );
    this.formulaRegistry = FormulaRegistryFactory.create();
  }

  static withConfig(language: string, config: Config): ReadSight {
    return new ReadSight(language, config.patternsDir, config.languagesDir, config.cacheDir);
  }

  // --- Static configuration ---

  static setDefaultConfig(config: Config): void {
    ReadSight.defaultConfig = config;
  }

  static setDefaultCacheDir(dir: string): void {
    const prev = ReadSight.defaultConfig ?? Config.default();
    ReadSight.defaultConfig = new Config(prev.patternsDir, prev.languagesDir, dir);
  }

  static setDefaultPatternsDir(dir: string): void {
    const prev = ReadSight.defaultConfig ?? Config.default();
    ReadSight.defaultConfig = new Config(dir, prev.languagesDir, prev.cacheDir);
  }

  static setDefaultLanguagesDir(dir: string): void {
    const prev = ReadSight.defaultConfig ?? Config.default();
    ReadSight.defaultConfig = new Config(prev.patternsDir, dir, prev.cacheDir);
  }

  static getSupportedLanguages(config?: Config): string[] {
    const languagesDir = (config ?? ReadSight.defaultConfig ?? Config.default()).languagesDir;
    return new JsonLanguageRepository(languagesDir).listCodes();
  }

  // --- Accessors ---

  getLanguage(): Language {
    return this.language;
  }

  getHyphenator(): Hyphenator {
    return this.hyphenator;
  }

  getFormulaRegistry(): FormulaRegistry {
    return this.formulaRegistry;
  }

  getSupportedFormulas(): string[] {
    return this.formulaRegistry.listForLanguage(this.language);
  }

  // --- Text / Syllable API ---

  splitWord(word: string): string[] {
    return this.text.splitWord(word);
  }

  splitSyllables(word: string): string[] {
    return this.text.splitSyllables(word);
  }

  syllableCount(word: string): number {
    return this.text.syllableCount(word);
  }

  wordCount(text: string): number {
    return this.text.wordCount(text);
  }

  sentenceCount(text: string): number {
    return this.text.sentenceCount(text);
  }

  letterCount(text: string): number {
    return this.text.letterCount(text);
  }

  totalSyllables(text: string): number {
    return this.text.totalSyllables(text);
  }

  averageSyllablesPerWord(text: string): number {
    return this.text.averageSyllablesPerWord(text);
  }

  averageWordsPerSentence(text: string): number {
    return this.text.averageWordsPerSentence(text);
  }

  polysyllableCount(text: string, countProperNouns = true): number {
    return this.text.polysyllableCount(text, countProperNouns);
  }

  wordsWithMoreThanNSyllables(text: string, n: number, countProperNouns = true): number {
    return this.text.wordsWithMoreThanNSyllables(text, n, countProperNouns);
  }

  histogramSyllables(text: string): Map<number, number> {
    return this.text.histogramSyllables(text);
  }

  analyze(text: string): TextStatistics {
    return this.text.analyze(text);
  }

  addHyphenations(hyphenations: Record<string, string>): void {
    this.text.addHyphenations(hyphenations);
  }

  // --- Formula API ---

  score(formulaName: string, text: string): FormulaResult {
    return this.formulaRegistry.calculate(formulaName, this.language, this.analyze(text));
  }

  fleschReadingEase(text: string): FormulaResult {
    return this.score("flesch_reading_ease", text);
  }

  fleschKincaidGradeLevel(text: string): FormulaResult {
    return this.score("flesch_kincaid_grade_level", text);
  }

  gunningFog(text: string): FormulaResult {
    return this.score("gunning_fog", text);
  }

  smogIndex(text: string): FormulaResult {
    return this.score("smog", text);
  }

  colemanLiau(text: string): FormulaResult {
    return this.score("coleman_liau", text);
  }

  automatedReadabilityIndex(text: string): FormulaResult {
    return this.score("ari", text);
  }

  lix(text: string): FormulaResult {
    return this.score("lix", text);
  }

  wienerSachtextformel(text: string, variant = 1): FormulaResult {
    const stats = this.analyze(text);
    const formula = this.formulaRegistry.get("wiener_sachtextformel");

    /* c8 ignore next 3 -- defensive: the formula is always registered */
    if (!(formula instanceof WienerSachtextformel)) {
      throw UnsupportedFormulaException.forLanguage("wiener_sachtextformel", this.language.code);
    }

    return formula.calculateVariant(stats, this.language, variant);
  }

  gulpease(text: string): FormulaResult {
    return this.score("gulpease", text);
  }

  fernandezHuerta(text: string): FormulaResult {
    return this.score("fernandez_huerta", text);
  }

  szigrisztPazos(text: string): FormulaResult {
    return this.score("szigriszt_pazos", text);
  }

  gutierrezPolini(text: string): FormulaResult {
    return this.score("gutierrez_polini", text);
  }

  crawford(text: string): FormulaResult {
    return this.score("crawford", text);
  }

  fogPL(text: string): FormulaResult {
    return this.score("fog_pl", text);
  }

  daleChall(text: string): FormulaResult {
    return this.score("dale_chall", text);
  }

  spache(text: string): FormulaResult {
    return this.score("spache", text);
  }

  osman(text: string): FormulaResult {
    return this.score("osman", text);
  }

  // --- Private helpers ---

  private static resolveConfig(
    patternsDir?: string,
    languagesDir?: string,
    cacheDir?: string,
  ): Config {
    const dflt = ReadSight.defaultConfig ?? Config.default();
    return new Config(
      patternsDir ?? dflt.patternsDir,
      languagesDir ?? dflt.languagesDir,
      cacheDir ?? dflt.cacheDir,
    );
  }

  private loadSyllableCounter(): SyllableCounter {
    const tex = new TexSyllableCounter(this.hyphenator);
    const mode = this.language.syllableMode;

    if (mode === "tex" || this.language.syllableHeuristics === null) {
      return tex;
    }

    const heuristic = new HeuristicSyllableCounter(this.language.syllableHeuristics);

    if (mode === "heuristic") {
      return heuristic;
    }

    return new CompositeSyllableCounter([heuristic, tex]);
  }

  private static loadHyphenator(
    language: Language,
    patternsDir: string,
    cacheDir: string,
  ): Hyphenator {
    const cache = new JsonPatternCache(cacheDir);
    const languageCode = language.code;

    if (cache.has(languageCode)) {
      const cached = cache.get(languageCode);
      if (cached !== null) {
        return new LiangHyphenator(
          cached.patterns,
          cached.exceptions,
          language.minHyphenLeft,
          language.minHyphenRight,
        );
      }
    }

    const texFile = `${patternsDir}/hyph-${languageCode}.tex`;
    const source = new TexSource(texFile);
    const loaded = source.load();

    cache.set(languageCode, loaded);

    return new LiangHyphenator(
      loaded.patterns,
      loaded.exceptions,
      language.minHyphenLeft,
      language.minHyphenRight,
    );
  }
}

/** Alias matching the PHP class name. */
export const Engine = ReadSight;
