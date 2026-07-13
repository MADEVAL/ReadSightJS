import { describe, expect, it } from "vitest";

import { UnsupportedFormulaException } from "../../../src/errors.js";
import { FormulaRegistry } from "../../../src/formula/formulaRegistry.js";
import { FormulaRegistryFactory } from "../../../src/formula/formulaRegistryFactory.js";
import { GunningFog } from "../../../src/formula/impls/universal.js";
import { Gulpease } from "../../../src/formula/impls/misc.js";
import { Language, type LanguageData } from "../../../src/language/language.js";
import { TextStatistics } from "../../../src/text/textStatistics.js";

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
  };
  return Language.fromData(data);
}

function makeStats(): TextStatistics {
  return new TextStatistics({
    letterCount: 200,
    wordCount: 50,
    sentenceCount: 5,
    syllableCount: 75,
    polysyllableCount: 5,
    averageSyllablesPerWord: 1.5,
    averageWordsPerSentence: 10.0,
    longWordCount: 8,
    syllableHistogram: new Map([[1, 30]]),
  });
}

describe("FormulaRegistry", () => {
  it("registers and looks up formulas", () => {
    const registry = new FormulaRegistry();
    const fog = new GunningFog();
    registry.register(fog);
    expect(registry.has("gunning_fog")).toBe(true);
    expect(registry.get("gunning_fog")).toBe(fog);
    expect(registry.get("nonexistent")).toBeNull();
  });

  it("lists names", () => {
    const registry = FormulaRegistryFactory.create();
    expect(registry.listNames().length).toBe(17);
  });

  it("lists formulas for a language (universal + specific)", () => {
    const registry = FormulaRegistryFactory.create();
    const forEn = registry.listForLanguage(makeLanguage("en-us"));
    expect(forEn).toContain("gunning_fog");
    const forIt = registry.listForLanguage(makeLanguage("it"));
    expect(forIt).toContain("gulpease");
    expect(forEn).not.toContain("gulpease");
  });

  it("calculates a supported formula", () => {
    const registry = FormulaRegistryFactory.create();
    const result = registry.calculate("gunning_fog", makeLanguage("en-us"), makeStats());
    expect(result.formulaName).toBe("gunning_fog");
  });

  it("throws for an unsupported formula name", () => {
    const registry = FormulaRegistryFactory.create();
    expect(() => registry.calculate("nope", makeLanguage("en-us"), makeStats())).toThrow(
      UnsupportedFormulaException,
    );
  });

  it("throws for a formula not supported by the language", () => {
    const registry = FormulaRegistryFactory.create();
    expect(() => registry.calculate("gulpease", makeLanguage("en-us"), makeStats())).toThrow(
      UnsupportedFormulaException,
    );
  });

  it("supports a language-specific formula on its language", () => {
    const registry = new FormulaRegistry();
    registry.register(new Gulpease());
    const result = registry.calculate("gulpease", makeLanguage("it"), makeStats());
    expect(result.formulaName).toBe("gulpease");
  });
});

describe("FormulaRegistryFactory", () => {
  it("creates a registry with all 17 formulas", () => {
    const registry = FormulaRegistryFactory.create();
    const names = registry.listNames().sort();
    expect(names).toEqual(
      [
        "ari",
        "coleman_liau",
        "crawford",
        "dale_chall",
        "fernandez_huerta",
        "flesch_kincaid_grade_level",
        "flesch_reading_ease",
        "fog_pl",
        "gulpease",
        "gunning_fog",
        "gutierrez_polini",
        "lix",
        "osman",
        "smog",
        "spache",
        "szigriszt_pazos",
        "wiener_sachtextformel",
      ].sort(),
    );
  });
});
