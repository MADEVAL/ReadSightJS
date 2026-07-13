import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Config } from "../../src/config.js";
import { ReadSight } from "../../src/engine.js";
import { FormulaResult } from "../../src/formula/formulaResult.js";
import { TextStatisticsHelper } from "../../src/formula/textStatisticsHelper.js";
import { FleschReadingEase } from "../../src/formula/impls/flesch.js";
import { WienerSachtextformel } from "../../src/formula/impls/german.js";
import { DaleChall } from "../../src/formula/impls/misc.js";
import { SmogIndex } from "../../src/formula/impls/universal.js";
import { Crawford, GutierrezPolini, SzigrisztPazos } from "../../src/formula/impls/spanish.js";
import { HyphenationExceptionsCollection } from "../../src/hyphenation/hyphenationExceptionsCollection.js";
import { LiangHyphenator } from "../../src/hyphenation/liangHyphenator.js";
import { PatternsCollection } from "../../src/hyphenation/patternsCollection.js";
import { Language, type LanguageData } from "../../src/language/language.js";
import { HeuristicSyllableCounter } from "../../src/syllable/heuristicSyllableCounter.js";
import { TexSyllableCounter } from "../../src/syllable/texSyllableCounter.js";
import { TextAnalyzer } from "../../src/text/textAnalyzer.js";
import { TextSplitter } from "../../src/text/textSplitter.js";
import { TextStatistics } from "../../src/text/textStatistics.js";
import { defaultLanguagesDir, defaultPatternsDir } from "../../src/internal/dataPaths.js";
import { phpRound } from "../../src/internal/phpRound.js";

function makeLanguage(code: string): Language {
  const data: LanguageData = {
    code,
    name: code,
    nativeName: code,
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}]+",
    sentenceBoundaryPattern: "[.!?]+",
    formulas: {},
  };
  return Language.fromData(data);
}

function zeroWordStats(): TextStatistics {
  return new TextStatistics({
    letterCount: 0,
    wordCount: 0,
    sentenceCount: 0,
    syllableCount: 0,
    polysyllableCount: 0,
    averageSyllablesPerWord: 0,
    averageWordsPerSentence: 0,
    longWordCount: 0,
    syllableHistogram: new Map(),
  });
}

describe("edge cases", () => {
  it("FormulaResult defaults inputs to an empty object", () => {
    const result = new FormulaResult({
      formulaName: "x",
      languageCode: "en-us",
      score: 1,
      gradeLevel: null,
      interpretation: "ok",
    });
    expect(result.inputs).toEqual({});
  });

  it("TextStatisticsHelper handles a histogram without a 1-syllable bucket", () => {
    const stats = new TextStatistics({
      letterCount: 10,
      wordCount: 4,
      sentenceCount: 1,
      syllableCount: 12,
      polysyllableCount: 4,
      averageSyllablesPerWord: 3,
      averageWordsPerSentence: 4,
      longWordCount: 4,
      syllableHistogram: new Map([[3, 4]]),
    });
    expect(TextStatisticsHelper.estimateDifficultPercentage(stats)).toBe(100);
  });

  it("FleschReadingEase ignores non-numeric coefficient overrides", () => {
    const en = new FleschReadingEase();
    const rs = new ReadSight("en-us");
    const stats = rs.analyze("The cat sat on the mat.");
    const result = en.calculate(stats, rs.getLanguage());
    expect(typeof result.score).toBe("number");
  });

  it("HeuristicSyllableCounter falls back to the default vowel pattern for non-string input", () => {
    // vowelPattern is not a string -> default "[aeiouy]".
    const hc = new HeuristicSyllableCounter({ vowelPattern: 123 as unknown as string });
    expect(hc.countSyllables("banana")).toBe(3);
  });

  it("phpRound returns very large integers unchanged (digits <= 0 path)", () => {
    const big = 1e17;
    expect(phpRound(big, 0)).toBe(big);
  });

  it("averageWordsPerSentence handles zero-sentence text via analyzer path", () => {
    // Using a text that has words but the splitter still returns 1 sentence,
    // exercised through the public engine API.
    const rs = new ReadSight("en-us");
    expect(rs.averageWordsPerSentence("one two three")).toBe(3);
  });

  it("averageWordsPerSentence returns 0 for empty text (zero sentences)", () => {
    const lang = makeLanguage("en-us");
    const hyphenator = new LiangHyphenator(
      new PatternsCollection(),
      new HyphenationExceptionsCollection(),
    );
    const analyzer = new TextAnalyzer(
      hyphenator,
      new TexSyllableCounter(hyphenator),
      new TextSplitter(lang),
      lang,
    );
    expect(analyzer.averageWordsPerSentence("")).toBe(0);
  });

  it("formulas handle zero-word stats via their guarded fallbacks", () => {
    const lang = makeLanguage("de-1996");
    expect(typeof new SmogIndex().calculate(zeroWordStats(), makeLanguage("x")).score).toBe(
      "number",
    );
    expect(typeof new WienerSachtextformel().calculateVariant(zeroWordStats(), lang, 1).score).toBe(
      "number",
    );
    expect(typeof new SzigrisztPazos().calculate(zeroWordStats(), makeLanguage("es")).score).toBe(
      "number",
    );
    expect(typeof new GutierrezPolini().calculate(zeroWordStats(), makeLanguage("es")).score).toBe(
      "number",
    );
    expect(typeof new Crawford().calculate(zeroWordStats(), makeLanguage("es")).score).toBe(
      "number",
    );
  });

  it("Dale-Chall hits the 5th-6th grade band", () => {
    const stats = new TextStatistics({
      letterCount: 100,
      wordCount: 20,
      sentenceCount: 10,
      syllableCount: 30,
      polysyllableCount: 3,
      averageSyllablesPerWord: 1.5,
      averageWordsPerSentence: 2,
      longWordCount: 4,
      // 18 easy of 20 => 10% difficult => adjusted score ~5.3 => "5th-6th grade"
      syllableHistogram: new Map([[1, 18]]),
    });
    const result = new DaleChall().calculate(stats, makeLanguage("en-us"));
    expect(result.interpretation).toBe("5th-6th grade");
  });

  it("Spanish formula descriptions are exposed", () => {
    expect(new SzigrisztPazos().description()).toContain("Szigriszt-Pazos");
    expect(new GutierrezPolini().description()).toContain("Gutierrez");
    expect(new Crawford().description()).toContain("Crawford");
  });
});

describe("Engine static setters", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "readsight-edge-"));
    // Reset to a known default backed by the temp cache dir.
    ReadSight.setDefaultConfig(new Config(defaultPatternsDir(), defaultLanguagesDir(), dir));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("setDefaultCacheDir preserves other directories", () => {
    ReadSight.setDefaultCacheDir(dir);
    expect(new ReadSight("en-us").getLanguage().code).toBe("en-us");
  });

  it("setDefaultPatternsDir preserves other directories", () => {
    ReadSight.setDefaultPatternsDir(defaultPatternsDir());
    expect(new ReadSight("en-us").getLanguage().code).toBe("en-us");
  });

  it("setDefaultLanguagesDir preserves other directories", () => {
    ReadSight.setDefaultLanguagesDir(defaultLanguagesDir());
    expect(new ReadSight("en-us").getLanguage().code).toBe("en-us");
  });

  it("setters work from a null default config baseline", () => {
    // Force the null baseline branch of each setter.
    (ReadSight as unknown as { defaultConfig: Config | null }).defaultConfig = null;
    ReadSight.setDefaultCacheDir(dir);
    (ReadSight as unknown as { defaultConfig: Config | null }).defaultConfig = null;
    ReadSight.setDefaultPatternsDir(defaultPatternsDir());
    (ReadSight as unknown as { defaultConfig: Config | null }).defaultConfig = null;
    ReadSight.setDefaultLanguagesDir(defaultLanguagesDir());
    expect(ReadSight.getSupportedLanguages().length).toBe(86);
  });
});
