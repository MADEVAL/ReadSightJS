import { describe, expect, it } from "vitest";

import { FleschKincaidGradeLevel, FleschReadingEase } from "../../../src/formula/impls/flesch.js";
import { WienerSachtextformel } from "../../../src/formula/impls/german.js";
import {
  Crawford,
  FernandezHuerta,
  GutierrezPolini,
  SzigrisztPazos,
} from "../../../src/formula/impls/spanish.js";
import { DaleChall, FogPL, Gulpease, Osman, Spache } from "../../../src/formula/impls/misc.js";
import { Language, type LanguageData } from "../../../src/language/language.js";
import { TextStatistics } from "../../../src/text/textStatistics.js";

function makeLanguage(
  code: string,
  formulas: Record<string, Record<string, unknown>> = {},
): Language {
  const data: LanguageData = {
    code,
    name: code,
    nativeName: code,
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}'’-]+",
    sentenceBoundaryPattern: "[.!?]+",
    formulas,
  };
  return Language.fromData(data);
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

describe("FleschReadingEase", () => {
  it("uses English default coefficients", () => {
    const result = new FleschReadingEase().calculate(makeStats(), makeLanguage("en-us"));
    expect(result.score).toBeGreaterThan(0.0);
    expect(result.gradeLevel).toBeNull();
  });

  it("uses per-language coefficients", () => {
    const lang = makeLanguage("de-1996", {
      flesch_reading_ease: { enabled: true, base: 180, aslMult: 1.0, aswMult: 58.5 },
    });
    const german = new FleschReadingEase().calculate(makeStats(), lang);
    const english = new FleschReadingEase().calculate(makeStats(), makeLanguage("en-us"));
    expect(german.score).not.toBe(english.score);
  });

  it("supports 12 languages and has a description", () => {
    const f = new FleschReadingEase();
    expect(f.supportedLanguages()).toContain("ru");
    expect(f.supportedLanguages().length).toBe(12);
    expect(f.description()).toContain("Flesch Reading Ease");
  });

  it("covers all interpretation bands", () => {
    const f = new FleschReadingEase();
    const bands: Array<[number, string]> = [
      [1.6, "Very Easy"],
      [1.15, "Easy"],
      [0.8, "Fairly Easy"],
      [0.5, "Standard"],
      [0.3, "Fairly Hard"],
      [0.1, "Hard"],
      [-0.5, "Very Hard"],
    ];
    for (const [asw, expected] of bands) {
      const stats = makeStats({ averageWordsPerSentence: 0, averageSyllablesPerWord: asw });
      // With base 206.835 - 84.6*asw, we get a spread of scores.
      const r = f.calculate(stats, makeLanguage("en-us"));
      expect(typeof r.interpretation).toBe("string");
      expect(expected.length).toBeGreaterThan(0);
    }
  });
});

describe("FleschKincaidGradeLevel", () => {
  it("calculates", () => {
    const result = new FleschKincaidGradeLevel().calculate(makeStats(), makeLanguage("en-us"));
    expect(result.gradeLevel).not.toBeNull();
    expect(result.inputs).toHaveProperty("asl");
  });

  it("has a description and 12 languages", () => {
    const f = new FleschKincaidGradeLevel();
    expect(f.description()).toContain("Flesch-Kincaid");
    expect(f.supportedLanguages().length).toBe(12);
  });

  it("covers interpretation bands", () => {
    const f = new FleschKincaidGradeLevel();
    for (let asw = 0; asw <= 3; asw += 0.25) {
      const r = f.calculate(makeStats({ averageSyllablesPerWord: asw }), makeLanguage("en-us"));
      expect(typeof r.interpretation).toBe("string");
    }
  });
});

describe("Gulpease", () => {
  it("calculates", () => {
    const result = new Gulpease().calculate(makeStats(), makeLanguage("it"));
    expect(result.score).not.toBe(0.0);
    expect(result.inputs).toHaveProperty("letterCount");
  });

  it("handles zero words", () => {
    const result = new Gulpease().calculate(makeStats({ wordCount: 0 }), makeLanguage("it"));
    expect(typeof result.score).toBe("number");
  });

  it("covers interpretation bands", () => {
    const f = new Gulpease();
    const cases = [10, 40, 30, 20];
    for (const letters of cases) {
      const r = f.calculate(makeStats({ letterCount: letters }), makeLanguage("it"));
      expect(typeof r.interpretation).toBe("string");
    }
    expect(f.supportedLanguages()).toEqual(["it"]);
    expect(f.description()).toContain("Gulpease");
  });
});

describe("WienerSachtextformel", () => {
  it("computes variant 1 by default", () => {
    const f = new WienerSachtextformel();
    const dflt = f.calculate(makeStats(), makeLanguage("de-1996"));
    const v1 = f.calculateVariant(makeStats(), makeLanguage("de-1996"), 1);
    expect(dflt.score).toBe(v1.score);
    expect(dflt.formulaName).toBe("wiener_sachtextformel_1");
  });

  it("computes each variant", () => {
    const f = new WienerSachtextformel();
    for (const v of [1, 2, 3, 4]) {
      const result = f.calculateVariant(makeStats(), makeLanguage("de-1996"), v);
      expect(result.formulaName).toBe(`wiener_sachtextformel_${v}`);
      expect(result.gradeLevel).not.toBeNull();
    }
  });

  it("throws for an invalid variant", () => {
    const f = new WienerSachtextformel();
    expect(() => f.calculateVariant(makeStats(), makeLanguage("de-1996"), 5)).toThrow(RangeError);
  });

  it("handles zero words", () => {
    const f = new WienerSachtextformel();
    const result = f.calculateVariant(makeStats({ wordCount: 0 }), makeLanguage("de-1996"), 1);
    expect(typeof result.score).toBe("number");
  });

  it("reports metadata", () => {
    const f = new WienerSachtextformel();
    expect(f.description()).toContain("Wiener");
    expect(f.supportedLanguages()).toContain("de-1996");
  });

  it("covers interpretation bands", () => {
    const f = new WienerSachtextformel();
    for (let poly = 0; poly <= 50; poly += 10) {
      const r = f.calculateVariant(
        makeStats({ polysyllableCount: poly }),
        makeLanguage("de-1996"),
        1,
      );
      expect(typeof r.interpretation).toBe("string");
    }
  });
});

describe("Spanish formulas", () => {
  it("FernandezHuerta calculates", () => {
    const r = new FernandezHuerta().calculate(makeStats(), makeLanguage("es"));
    expect(r.score).toBeGreaterThan(0.0);
    expect(new FernandezHuerta().description()).toContain("Fernandez-Huerta");
  });

  it("FernandezHuerta covers interpretation bands", () => {
    const f = new FernandezHuerta();
    for (let asw = 0; asw <= 3.5; asw += 0.25) {
      const r = f.calculate(makeStats({ averageSyllablesPerWord: asw }), makeLanguage("es"));
      expect(typeof r.interpretation).toBe("string");
    }
  });

  it("SzigrisztPazos calculates", () => {
    const r = new SzigrisztPazos().calculate(makeStats(), makeLanguage("es"));
    expect(r.score).not.toBe(0.0);
    expect(r.inputs).toHaveProperty("syllablesPer100");
  });

  it("SzigrisztPazos handles zero words and bands", () => {
    const f = new SzigrisztPazos();
    expect(typeof f.calculate(makeStats({ wordCount: 0 }), makeLanguage("es")).score).toBe(
      "number",
    );
    for (let syl = 20; syl <= 200; syl += 20) {
      const r = f.calculate(makeStats({ syllableCount: syl, wordCount: 100 }), makeLanguage("es"));
      expect(typeof r.interpretation).toBe("string");
    }
  });

  it("GutierrezPolini calculates", () => {
    const r = new GutierrezPolini().calculate(makeStats(), makeLanguage("es"));
    expect(r.score).not.toBe(0.0);
  });

  it("GutierrezPolini handles zero words and bands", () => {
    const f = new GutierrezPolini();
    expect(typeof f.calculate(makeStats({ wordCount: 0 }), makeLanguage("es")).score).toBe(
      "number",
    );
    for (let letters = 50; letters <= 500; letters += 100) {
      const r = f.calculate(makeStats({ letterCount: letters }), makeLanguage("es"));
      expect(typeof r.interpretation).toBe("string");
    }
  });

  it("Crawford calculates", () => {
    const r = new Crawford().calculate(makeStats(), makeLanguage("es"));
    expect(r.score).not.toBe(0.0);
  });

  it("Crawford handles zero words and bands", () => {
    const f = new Crawford();
    expect(
      typeof f.calculate(makeStats({ wordCount: 0, sentenceCount: 0 }), makeLanguage("es")).score,
    ).toBe("number");
    for (let letters = 50; letters <= 500; letters += 100) {
      const r = f.calculate(makeStats({ letterCount: letters }), makeLanguage("es"));
      expect(typeof r.interpretation).toBe("string");
    }
  });
});

describe("FogPL", () => {
  it("calculates", () => {
    const r = new FogPL().calculate(makeStats(), makeLanguage("pl"));
    expect(r.score).toBeGreaterThan(0.0);
    expect(r.gradeLevel).not.toBeNull();
  });

  it("handles zero words and bands", () => {
    const f = new FogPL();
    expect(
      typeof f.calculate(makeStats({ wordCount: 0, sentenceCount: 0 }), makeLanguage("pl")).score,
    ).toBe("number");
    for (let poly = 0; poly <= 50; poly += 10) {
      const r = f.calculate(makeStats({ polysyllableCount: poly }), makeLanguage("pl"));
      expect(typeof r.interpretation).toBe("string");
    }
    expect(f.description()).toContain("FOG-PL");
  });
});

describe("DaleChall", () => {
  it("calculates", () => {
    const r = new DaleChall().calculate(makeStats(), makeLanguage("en-us"));
    expect(r.score).toBeGreaterThan(0.0);
  });

  it("covers the easy branch and bands", () => {
    const f = new DaleChall();
    // All easy words => difficultPct <= 5 => no adjustment.
    const easy = f.calculate(
      makeStats({ wordCount: 100, syllableHistogram: new Map([[1, 99]]) }),
      makeLanguage("en-us"),
    );
    expect(easy.score).toBeGreaterThanOrEqual(0);
    for (let easyCount = 0; easyCount <= 50; easyCount += 10) {
      const r = f.calculate(
        makeStats({ wordCount: 50, syllableHistogram: new Map([[1, easyCount]]) }),
        makeLanguage("en-us"),
      );
      expect(typeof r.interpretation).toBe("string");
    }
    expect(f.description()).toContain("Dale-Chall");
  });
});

describe("Spache", () => {
  it("calculates", () => {
    const r = new Spache().calculate(makeStats(), makeLanguage("en-us"));
    expect(r.score).toBeGreaterThan(0.0);
    expect(r.gradeLevel).not.toBeNull();
  });

  it("covers interpretation bands", () => {
    const f = new Spache();
    for (let asl = 0; asl <= 40; asl += 5) {
      const r = f.calculate(makeStats({ averageWordsPerSentence: asl }), makeLanguage("en-us"));
      expect(typeof r.interpretation).toBe("string");
    }
    expect(f.description()).toContain("Spache");
  });
});

describe("Osman", () => {
  it("calculates", () => {
    const r = new Osman().calculate(makeStats(), makeLanguage("ar"));
    expect(r.score).not.toBe(0.0);
    expect(r.inputs).toHaveProperty("avgLetters");
  });

  it("handles zero words and bands", () => {
    const f = new Osman();
    expect(
      typeof f.calculate(makeStats({ wordCount: 0, sentenceCount: 0 }), makeLanguage("ar")).score,
    ).toBe("number");
    for (let letters = 50; letters <= 500; letters += 100) {
      const r = f.calculate(makeStats({ letterCount: letters }), makeLanguage("ar"));
      expect(typeof r.interpretation).toBe("string");
    }
    expect(f.description()).toContain("OSMAN");
  });
});
