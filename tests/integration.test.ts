import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Config, ReadSight, UnsupportedFormulaException } from "../src/index.js";
import { defaultLanguagesDir, defaultPatternsDir } from "../src/internal/dataPaths.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

let cacheDir: string;

function engine(code: string): ReadSight {
  return ReadSight.withConfig(
    code,
    new Config(defaultPatternsDir(), defaultLanguagesDir(), cacheDir),
  );
}

beforeAll(() => {
  cacheDir = mkdtempSync(join(tmpdir(), "readsight-it-"));
});

afterAll(() => {
  rmSync(cacheDir, { recursive: true, force: true });
});

describe("ReadSight integration", () => {
  it("creates an English engine", () => {
    const rs = engine("en-us");
    expect(rs.getLanguage().code).toBe("en-us");
    expect(rs.getLanguage().name).toBe("English (US)");
  });

  it("creates a German engine", () => {
    expect(engine("de-1996").getLanguage().code).toBe("de-1996");
  });

  it("creates a Russian engine", () => {
    expect(engine("ru").getLanguage().code).toBe("ru");
  });

  it("lists supported languages", () => {
    const langs = ReadSight.getSupportedLanguages();
    expect(langs).toContain("en-us");
    expect(langs).toContain("ru");
    expect(langs).toContain("de-1996");
    expect(langs.length).toBeGreaterThanOrEqual(86);
  });

  it("lists supported formulas", () => {
    const formulas = engine("en-us").getSupportedFormulas();
    expect(formulas).toContain("gunning_fog");
    expect(formulas).toContain("flesch_reading_ease");
    expect(formulas).toContain("ari");
  });

  it("counts syllables", () => {
    const rs = engine("en-us");
    expect(rs.syllableCount("banana")).toBe(3);
    expect(rs.syllableCount("hyphenation")).toBe(4);
    expect(rs.syllableCount("hello")).toBe(2);
  });

  it("splits words", () => {
    expect(engine("en-us").splitWord("hyphenation").length).toBeGreaterThanOrEqual(3);
  });

  it("exposes the hyphenator", () => {
    const rs = engine("en-us");
    expect(rs.getHyphenator().countSyllables("banana")).toBe(2);
  });

  it("exposes the formula registry", () => {
    expect(engine("en-us").getFormulaRegistry().listNames().length).toBe(17);
  });

  it("analyzes Moby Dick opening", () => {
    const rs = engine("en-us");
    const text = readFileSync(join(fixturesDir, "text", "moby-dick-opening.txt"), "utf-8");
    const stats = rs.analyze(text);
    expect(stats.wordCount).toBeGreaterThan(50);
    expect(stats.sentenceCount).toBeGreaterThan(1);
    expect(stats.letterCount).toBeGreaterThan(200);
    expect(stats.syllableCount).toBeGreaterThan(100);
  });

  it("computes text metrics", () => {
    const rs = engine("en-us");
    const text = "one two three. four five.";
    expect(rs.wordCount(text)).toBe(5);
    expect(rs.sentenceCount(text)).toBe(2);
    expect(rs.letterCount(text)).toBeGreaterThan(0);
    expect(rs.totalSyllables(text)).toBeGreaterThan(0);
    expect(rs.averageSyllablesPerWord(text)).toBeGreaterThan(0);
    expect(rs.averageWordsPerSentence(text)).toBeGreaterThan(0);
    expect(rs.polysyllableCount("banana extraordinary")).toBeGreaterThanOrEqual(1);
    expect(rs.wordsWithMoreThanNSyllables(text, 1)).toBeGreaterThanOrEqual(0);
    expect(rs.histogramSyllables(text).size).toBeGreaterThan(0);
  });

  it("computes Gunning Fog", () => {
    const rs = engine("en-us");
    const result = rs.gunningFog(
      "The quick brown fox jumps over the lazy dog. This is a simple sentence for testing.",
    );
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.formulaName).toBe("gunning_fog");
    expect(result.languageCode).toBe("en-us");
    expect(typeof result.interpretation).toBe("string");
    expect(result.inputs).toHaveProperty("asl");
  });

  it("computes Flesch Reading Ease", () => {
    const result = engine("en-us").fleschReadingEase(
      "The cat sat on the mat. It was a very good day.",
    );
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.formulaName).toBe("flesch_reading_ease");
  });

  it("computes Flesch-Kincaid Grade Level", () => {
    const result = engine("en-us").fleschKincaidGradeLevel(
      "The quick brown fox jumps over the lazy dog.",
    );
    expect(typeof result.score).toBe("number");
    expect(result.gradeLevel).not.toBeNull();
  });

  it("computes SMOG", () => {
    const result = engine("en-us").smogIndex(
      "This is a test. It has a few sentences. Here is a polysyllabic word like complicated or sophisticated.",
    );
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes Coleman-Liau", () => {
    const result = engine("en-us").colemanLiau("The cat sat on the mat.");
    expect(typeof result.score).toBe("number");
    expect(result.gradeLevel).not.toBeNull();
  });

  it("computes ARI", () => {
    const result = engine("en-us").automatedReadabilityIndex(
      "Testing the automated readability index. It uses character counts.",
    );
    expect(result.score).not.toBe(0.0);
  });

  it("computes LIX", () => {
    const result = engine("en-us").lix(
      "This is a simple text for LIX testing. It has a few sentences.",
    );
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes Dale-Chall", () => {
    const result = engine("en-us").daleChall(
      "The boy ran to the store. He wanted some candy and a toy.",
    );
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes Spache", () => {
    const result = engine("en-us").spache("The cat sat on the mat. The dog ran to the park.");
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes Wiener Sachtextformel", () => {
    const result = engine("de-1996").wienerSachtextformel(
      "Dies ist ein einfacher deutscher Text. Er hat mehrere Sätze für den Test.",
      1,
    );
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes Gulpease", () => {
    const result = engine("it").gulpease(
      "Questo è un semplice testo italiano. Serve per testare la formula Gulpease.",
    );
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes the Spanish family", () => {
    const rs = engine("es");
    expect(
      rs.fernandezHuerta("Este es un texto simple en español. Sirve para probar la fórmula.").score,
    ).toBeGreaterThan(0);
    expect(
      rs.szigrisztPazos("Texto de prueba para la fórmula Szigriszt-Pazos en español.").score,
    ).toBeGreaterThan(0);
    expect(
      rs.gutierrezPolini("Prueba de comprensibilidad para Gutierrez Polini.").score,
    ).toBeGreaterThan(0);
    expect(typeof rs.crawford("Texto escolar para probar la fórmula Crawford.").score).toBe(
      "number",
    );
  });

  it("computes FOG-PL", () => {
    const result = engine("pl").fogPL("To jest prosty polski tekst do testowania formuły FOG-PL.");
    expect(result.score).toBeGreaterThan(0.0);
  });

  it("computes OSMAN", () => {
    const result = engine("ar").osman("هذا نص عربي بسيط لاختبار صيغة عثمان للقياس القرائي.");
    expect(typeof result.score).toBe("number");
  });

  it("dispatches via the generic score method", () => {
    const result = engine("en-us").score(
      "gunning_fog",
      "The quick brown fox. Simple sentences for testing.",
    );
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.formulaName).toBe("gunning_fog");
  });

  it("throws for an unsupported formula", () => {
    expect(() => engine("en-us").score("gulpease", "some text")).toThrow(
      UnsupportedFormulaException,
    );
  });

  it("computes wienerSachtextformel regardless of language (mirrors reference)", () => {
    const result = engine("en-us").wienerSachtextformel("The cat sat on the mat. It ran fast.");
    expect(result.formulaName).toBe("wiener_sachtextformel_1");
  });

  it("supports user hyphenation overrides", () => {
    const rs = engine("en-us");
    rs.addHyphenations({ testword: "test-word" });
    expect(rs.splitWord("testword")).toEqual(["test", "word"]);
  });

  it("builds a syllable histogram", () => {
    const hist = engine("en-us").histogramSyllables("cat dog banana extraordinary");
    expect(hist.size).toBeGreaterThan(0);
  });

  it("computes Flesch Reading Ease for Russian", () => {
    const result = engine("ru").fleschReadingEase(
      "Это простой русский текст для тестирования формулы читабельности.",
    );
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.languageCode).toBe("ru");
  });
});

describe("Cyrillic syllable counting", () => {
  it("Russian uses heuristic mode", () => {
    expect(engine("ru").getLanguage().syllableMode).toBe("heuristic");
  });

  it("Russian counts vowels as syllables", () => {
    const rs = engine("ru");
    const expected: Record<string, number> = {
      беззвучная: 4,
      дыхание: 4,
      молоко: 3,
      привет: 2,
      я: 1,
    };
    for (const [word, count] of Object.entries(expected)) {
      expect(rs.syllableCount(word), word).toBe(count);
    }
  });

  it("Ukrainian uses heuristic mode", () => {
    expect(engine("uk").getLanguage().syllableMode).toBe("heuristic");
  });

  it("Belarusian uses heuristic mode", () => {
    expect(engine("be").getLanguage().syllableMode).toBe("heuristic");
  });

  it("Bulgarian uses heuristic mode", () => {
    expect(engine("bg").getLanguage().syllableMode).toBe("heuristic");
  });

  it("split_word still uses TeX hyphenation", () => {
    expect(engine("ru").splitWord("беззвучная")).toEqual(["без", "звуч", "ная"]);
  });
});

describe("Engine default configuration", () => {
  it("uses withConfig and static setters", () => {
    const config = new Config(defaultPatternsDir(), defaultLanguagesDir(), cacheDir);
    ReadSight.setDefaultConfig(config);
    const rs = new ReadSight("en-us");
    expect(rs.getLanguage().code).toBe("en-us");

    ReadSight.setDefaultCacheDir(cacheDir);
    ReadSight.setDefaultPatternsDir(defaultPatternsDir());
    ReadSight.setDefaultLanguagesDir(defaultLanguagesDir());
    expect(ReadSight.getSupportedLanguages().length).toBe(86);
  });

  it("Engine alias equals ReadSight", async () => {
    const { Engine } = await import("../src/index.js");
    expect(Engine).toBe(ReadSight);
  });

  it("loads patterns from cache on the second instantiation", () => {
    const cfg = new Config(defaultPatternsDir(), defaultLanguagesDir(), cacheDir);
    ReadSight.withConfig("nl", cfg);
    // Second load hits the JSON cache branch.
    const rs = ReadSight.withConfig("nl", cfg);
    expect(rs.syllableCount("communicatie")).toBe(5);
  });
});
