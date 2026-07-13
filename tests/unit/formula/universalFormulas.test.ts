import { describe, expect, it } from "vitest";

import {
  AutomatedReadabilityIndex,
  ColemanLiau,
  GunningFog,
  Lix,
  SmogIndex,
} from "../../../src/formula/impls/universal.js";
import { Language, type LanguageData } from "../../../src/language/language.js";
import { TextStatistics } from "../../../src/text/textStatistics.js";

function makeLanguage(code = "en-us", overrides: Partial<LanguageData> = {}): Language {
  return Language.fromData({
    code,
    name: "English (US)",
    nativeName: "English (US)",
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}'’-]+",
    sentenceBoundaryPattern: "[.!?]+",
    formulas: { lix: { enabled: true, longWordThreshold: 6 } },
    ...overrides,
  });
}

function makeStats(
  overrides: Partial<ConstructorParameters<typeof TextStatistics>[0]> = {},
): TextStatistics {
  return new TextStatistics({
    letterCount: 200,
    wordCount: 50,
    sentenceCount: 5,
    syllableCount: 75,
    polysyllableCount: 5,
    averageSyllablesPerWord: 1.5,
    averageWordsPerSentence: 10.0,
    longWordCount: 8,
    syllableHistogram: new Map([
      [1, 30],
      [2, 15],
      [3, 5],
    ]),
    ...overrides,
  });
}

describe("GunningFog", () => {
  it("calculates", () => {
    const result = new GunningFog().calculate(makeStats(), makeLanguage());
    expect(result.formulaName).toBe("gunning_fog");
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.gradeLevel).not.toBeNull();
    expect(result.inputs).toHaveProperty("asl");
  });

  it("handles zero words", () => {
    const result = new GunningFog().calculate(
      makeStats({ wordCount: 0, averageWordsPerSentence: 0.0 }),
      makeLanguage(),
    );
    expect(result.score).toBe(0.0);
  });

  it("reports metadata", () => {
    const f = new GunningFog();
    expect(f.description()).toContain("Gunning Fog");
    expect(f.supportedLanguages()).toEqual(["*"]);
  });
});

describe("SmogIndex", () => {
  it("calculates", () => {
    const result = new SmogIndex().calculate(makeStats(), makeLanguage());
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.gradeLevel).not.toBeNull();
  });

  it("reports metadata", () => {
    expect(new SmogIndex().description()).toContain("SMOG");
    expect(new SmogIndex().supportedLanguages()).toEqual(["*"]);
  });
});

describe("ColemanLiau", () => {
  it("calculates", () => {
    const result = new ColemanLiau().calculate(makeStats(), makeLanguage());
    expect(result.score).not.toBe(0.0);
    expect(result.inputs).toHaveProperty("L");
    expect(result.inputs).toHaveProperty("S");
  });

  it("handles zero words and sentences", () => {
    const result = new ColemanLiau().calculate(
      makeStats({ wordCount: 0, sentenceCount: 0 }),
      makeLanguage(),
    );
    expect(typeof result.score).toBe("number");
  });

  it("reports metadata", () => {
    expect(new ColemanLiau().description()).toContain("Coleman-Liau");
  });
});

describe("AutomatedReadabilityIndex", () => {
  it("calculates", () => {
    const result = new AutomatedReadabilityIndex().calculate(makeStats(), makeLanguage());
    expect(result.score).not.toBe(0.0);
  });

  it("handles zero words and sentences", () => {
    const result = new AutomatedReadabilityIndex().calculate(
      makeStats({ wordCount: 0, sentenceCount: 0 }),
      makeLanguage(),
    );
    expect(typeof result.score).toBe("number");
  });

  it("reports metadata", () => {
    expect(new AutomatedReadabilityIndex().description()).toContain("Automated Readability");
  });
});

describe("Lix", () => {
  it("calculates", () => {
    const result = new Lix().calculate(makeStats(), makeLanguage());
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.inputs).toHaveProperty("longWordPct");
  });

  it("uses a custom threshold", () => {
    const lang = makeLanguage("pl", {
      formulas: { lix: { enabled: true, longWordThreshold: 4 } },
    });
    const result = new Lix().calculate(makeStats(), lang);
    expect(result.inputs["threshold"]).toBe(4);
  });

  it("defaults threshold when config is absent", () => {
    const lang = makeLanguage("xx", { formulas: {} });
    const result = new Lix().calculate(makeStats(), lang);
    expect(result.inputs["threshold"]).toBe(6);
  });

  it("handles zero words", () => {
    const result = new Lix().calculate(
      makeStats({ wordCount: 0, averageWordsPerSentence: 0 }),
      makeLanguage(),
    );
    expect(result.score).toBe(0);
  });

  it("reports metadata", () => {
    expect(new Lix().description()).toContain("LIX");
    expect(new Lix().supportedLanguages()).toEqual(["*"]);
  });
});
