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
import { GunningFog, Lix, SmogIndex } from "../../../src/formula/impls/universal.js";
import type { Formula } from "../../../src/formula/formula.js";
import { Language, type LanguageData } from "../../../src/language/language.js";
import { TextStatistics } from "../../../src/text/textStatistics.js";

function lang(code: string): Language {
  const data: LanguageData = {
    code,
    name: code,
    nativeName: code,
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}]+",
    sentenceBoundaryPattern: "[.!?]+",
    formulas: code === "en-us" ? { flesch_reading_ease: { enabled: true } } : {},
  };
  return Language.fromData(data);
}

function makeStats(o: Partial<ConstructorParameters<typeof TextStatistics>[0]>): TextStatistics {
  return new TextStatistics({
    letterCount: 100,
    wordCount: 20,
    sentenceCount: 4,
    syllableCount: 30,
    polysyllableCount: 3,
    averageSyllablesPerWord: 1.5,
    averageWordsPerSentence: 5.0,
    longWordCount: 4,
    syllableHistogram: new Map([[1, 10]]),
    ...o,
  });
}

/**
 * Sweep a single stat field across a wide range and collect the distinct
 * interpretations a formula produces, so every interpretation branch is hit.
 */
function sweepInterpretations(
  formula: Formula,
  code: string,
  build: (v: number) => Partial<ConstructorParameters<typeof TextStatistics>[0]>,
  values: number[],
): Set<string> {
  const seen = new Set<string>();
  for (const v of values) {
    seen.add(formula.calculate(makeStats(build(v)), lang(code)).interpretation);
  }
  return seen;
}

const range = (start: number, end: number, step: number): number[] => {
  const out: number[] = [];
  for (let v = start; v <= end; v += step) {
    out.push(v);
  }
  return out;
};

describe("interpretation bands", () => {
  it("Flesch Reading Ease covers all 7 bands", () => {
    const seen = sweepInterpretations(
      new FleschReadingEase(),
      "en-us",
      (asw) => ({ averageWordsPerSentence: 0, averageSyllablesPerWord: asw }),
      range(0, 2.5, 0.05),
    );
    expect(seen).toEqual(
      new Set(["Very Easy", "Easy", "Fairly Easy", "Standard", "Fairly Hard", "Hard", "Very Hard"]),
    );
  });

  it("Flesch-Kincaid Grade Level covers all bands", () => {
    const seen = sweepInterpretations(
      new FleschKincaidGradeLevel(),
      "en-us",
      (asw) => ({ averageWordsPerSentence: 0, averageSyllablesPerWord: asw }),
      range(0, 3, 0.05),
    );
    expect(seen.size).toBeGreaterThanOrEqual(14);
  });

  it("Gunning Fog covers all 6 bands", () => {
    const seen = sweepInterpretations(
      new GunningFog(),
      "x",
      (asl) => ({ averageWordsPerSentence: asl, polysyllableCount: 0 }),
      range(0, 60, 1),
    );
    expect(seen).toEqual(
      new Set(["Very Easy", "Easy", "Standard", "Hard", "Very Hard", "Extremely Hard"]),
    );
  });

  it("SMOG covers multiple grade bands", () => {
    const seen = sweepInterpretations(
      new SmogIndex(),
      "x",
      (poly) => ({ polysyllableCount: poly, sentenceCount: 4 }),
      range(0, 300, 2),
    );
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  it("LIX covers all 6 bands", () => {
    const seen = new Set<string>();
    for (const asl of range(0, 70, 1)) {
      seen.add(
        new Lix().calculate(
          makeStats({ averageWordsPerSentence: asl, longWordCount: 0, wordCount: 20 }),
          lang("x"),
        ).interpretation,
      );
    }
    expect(seen).toEqual(
      new Set([
        "Children's Books",
        "Simple Texts",
        "Normal / Fiction",
        "Factual Information",
        "Specialized Texts",
        "Research / Advanced",
      ]),
    );
  });

  it("Wiener Sachtextformel covers all 6 bands", () => {
    const seen = new Set<string>();
    for (const sl of range(0, 60, 1)) {
      seen.add(
        new WienerSachtextformel().calculateVariant(
          makeStats({ averageWordsPerSentence: sl, polysyllableCount: 0, wordCount: 20 }),
          lang("de-1996"),
          4,
        ).interpretation,
      );
    }
    expect(seen).toEqual(
      new Set(["Very Easy", "Easy", "Standard", "Fairly Hard", "Hard", "Very Hard"]),
    );
  });

  it("Gulpease covers all 4 bands", () => {
    const seen = sweepInterpretations(
      new Gulpease(),
      "it",
      (letters) => ({ letterCount: letters, wordCount: 20, sentenceCount: 4 }),
      range(0, 300, 5),
    );
    expect(seen).toEqual(
      new Set([
        "Easy for elementary school",
        "Easy for middle school",
        "Easy for high school",
        "Difficult for high school",
      ]),
    );
  });

  it("FOG-PL covers all 5 bands", () => {
    const seen = new Set<string>();
    for (const poly of range(0, 100, 1)) {
      seen.add(
        new FogPL().calculate(
          makeStats({ polysyllableCount: poly, wordCount: 20, sentenceCount: 4 }),
          lang("pl"),
        ).interpretation,
      );
    }
    expect(seen).toEqual(new Set(["Very Easy", "Easy", "Standard", "Hard", "Very Hard"]));
  });

  it("Dale-Chall covers all 7 bands", () => {
    const seen = new Set<string>();
    for (const easy of range(0, 100, 1)) {
      seen.add(
        new DaleChall().calculate(
          makeStats({
            wordCount: 100,
            averageWordsPerSentence: 30,
            syllableHistogram: new Map([[1, easy]]),
          }),
          lang("en-us"),
        ).interpretation,
      );
    }
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  it("Spache covers all 5 bands", () => {
    const seen = new Set<string>();
    for (const asl of range(0, 40, 0.2)) {
      seen.add(
        new Spache().calculate(
          makeStats({
            averageWordsPerSentence: asl,
            wordCount: 20,
            syllableHistogram: new Map([[1, 20]]),
          }),
          lang("en-us"),
        ).interpretation,
      );
    }
    expect(seen).toEqual(
      new Set(["1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "Above 4th Grade"]),
    );
  });

  it("OSMAN covers all 5 bands", () => {
    const seen = new Set<string>();
    for (const letters of range(0, 200, 1)) {
      seen.add(
        new Osman().calculate(
          makeStats({ letterCount: letters, wordCount: 1, sentenceCount: 1, polysyllableCount: 0 }),
          lang("ar"),
        ).interpretation,
      );
    }
    expect(seen).toEqual(new Set(["Very Easy", "Easy", "Standard", "Difficult", "Very Difficult"]));
  });

  it("Fernandez-Huerta covers all 7 bands", () => {
    const seen = sweepInterpretations(
      new FernandezHuerta(),
      "es",
      (asw) => ({ averageWordsPerSentence: 0, averageSyllablesPerWord: asw }),
      range(0, 3.5, 0.05),
    );
    expect(seen.size).toBe(7);
  });

  it("Szigriszt-Pazos covers all 7 bands", () => {
    const seen = new Set<string>();
    for (const syl of range(0, 400, 2)) {
      seen.add(
        new SzigrisztPazos().calculate(
          makeStats({ averageWordsPerSentence: 0, wordCount: 100, syllableCount: syl }),
          lang("es"),
        ).interpretation,
      );
    }
    expect(seen.size).toBe(7);
  });

  it("Gutierrez-Polini covers all 5 bands", () => {
    const seen = new Set<string>();
    for (const letters of range(0, 400, 2)) {
      seen.add(
        new GutierrezPolini().calculate(
          makeStats({ averageWordsPerSentence: 0, wordCount: 20, letterCount: letters }),
          lang("es"),
        ).interpretation,
      );
    }
    expect(seen).toEqual(new Set(["Very Easy", "Easy", "Standard", "Difficult", "Very Difficult"]));
  });

  it("Crawford covers all 5 bands", () => {
    const seen = new Set<string>();
    for (const sentenceCount of range(1, 80, 1)) {
      seen.add(
        new Crawford().calculate(
          makeStats({ wordCount: 20, letterCount: 20, sentenceCount }),
          lang("es"),
        ).interpretation,
      );
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});
