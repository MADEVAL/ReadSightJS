import { describe, expect, it } from "vitest";

import { Language, type LanguageData } from "../../../src/language/language.js";
import { Script } from "../../../src/language/script.js";

function makeEnUsData(): LanguageData {
  return {
    code: "en-us",
    name: "English (US)",
    nativeName: "English (US)",
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}]+",
    sentenceBoundaryPattern: "[.!?]+",
    formulas: {
      gunning_fog: { enabled: true },
      flesch_reading_ease: { enabled: true, base: 206.835 },
    },
    syllableMode: "composite",
    syllableHeuristics: { vowelPattern: "[aeiouy]" },
  };
}

describe("Language", () => {
  it("fromData basic", () => {
    const lang = Language.fromData(makeEnUsData());
    expect(lang.code).toBe("en-us");
    expect(lang.name).toBe("English (US)");
    expect(lang.script).toBe(Script.Latin);
    expect(lang.minHyphenLeft).toBe(2);
    expect(lang.minHyphenRight).toBe(2);
    expect(lang.syllableMode).toBe("composite");
  });

  it("supportsFormula", () => {
    const lang = Language.fromData(makeEnUsData());
    expect(lang.supportsFormula("gunning_fog")).toBe(true);
    expect(lang.supportsFormula("nonsense")).toBe(false);
  });

  it("getFormulaConfig", () => {
    const lang = Language.fromData(makeEnUsData());
    const config = lang.getFormulaConfig("flesch_reading_ease");
    expect(config).not.toBeNull();
    expect(config!["base"]).toBe(206.835);
  });

  it("getFormulaConfig missing", () => {
    const lang = Language.fromData(makeEnUsData());
    expect(lang.getFormulaConfig("nonexistent")).toBeNull();
  });

  it("getSupportedFormulas", () => {
    const lang = Language.fromData(makeEnUsData());
    const formulas = lang.getSupportedFormulas();
    expect(formulas).toContain("gunning_fog");
    expect(formulas).toContain("flesch_reading_ease");
  });

  it("defaults syllableMode to tex", () => {
    const data = makeEnUsData();
    delete data.syllableMode;
    const lang = Language.fromData(data);
    expect(lang.syllableMode).toBe("tex");
  });

  it("handles absent heuristics", () => {
    const data = makeEnUsData();
    delete data.syllableHeuristics;
    const lang = Language.fromData(data);
    expect(lang.syllableHeuristics).toBeNull();
  });

  it("defaults formulas to empty when absent", () => {
    const data = makeEnUsData();
    delete data.formulas;
    const lang = Language.fromData(data);
    expect(lang.getSupportedFormulas()).toEqual([]);
  });

  it("accepts explicit constructor params", () => {
    const lang = new Language({
      code: "xx",
      name: "X",
      nativeName: "X",
      script: Script.Other,
      minHyphenLeft: 1,
      minHyphenRight: 1,
      letterPattern: "[a-z]",
      wordSplitPattern: "\\s+",
      sentenceBoundaryPattern: "[.]",
      formulaConfigs: {},
      syllableHeuristics: null,
      syllableMode: "tex",
    });
    expect(lang.script).toBe(Script.Other);
    expect(lang.nativeName).toBe("X");
  });
});
