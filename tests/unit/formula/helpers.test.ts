import { describe, expect, it } from "vitest";

import { GradeLevelInterpretation } from "../../../src/formula/gradeLevelInterpretation.js";
import { TextStatisticsHelper } from "../../../src/formula/textStatisticsHelper.js";
import { TextStatistics } from "../../../src/text/textStatistics.js";

describe("GradeLevelInterpretation", () => {
  it("kindergarten", () => {
    expect(GradeLevelInterpretation.forScore(0.5)).toBe("Kindergarten");
    expect(GradeLevelInterpretation.forScore(1.0)).toBe("Kindergarten");
  });

  it("grades", () => {
    expect(GradeLevelInterpretation.forScore(3.5)).toBe("3rd Grade");
    expect(GradeLevelInterpretation.forScore(7.0)).toBe("6th Grade");
    expect(GradeLevelInterpretation.forScore(9.0)).toBe("8th Grade");
    expect(GradeLevelInterpretation.forScore(12.0)).toBe("11th Grade");
    expect(GradeLevelInterpretation.forScore(13.0)).toBe("12th Grade");
  });

  it("covers every band", () => {
    expect(GradeLevelInterpretation.forScore(2.0)).toBe("1st Grade");
    expect(GradeLevelInterpretation.forScore(4.0)).toBe("3rd Grade");
    expect(GradeLevelInterpretation.forScore(5.0)).toBe("4th Grade");
    expect(GradeLevelInterpretation.forScore(6.0)).toBe("5th Grade");
    expect(GradeLevelInterpretation.forScore(8.0)).toBe("7th Grade");
    expect(GradeLevelInterpretation.forScore(10.0)).toBe("9th Grade");
    expect(GradeLevelInterpretation.forScore(11.0)).toBe("10th Grade");
  });

  it("college and graduate", () => {
    expect(GradeLevelInterpretation.forScore(16.0)).toBe("College");
    expect(GradeLevelInterpretation.forScore(17.0)).toBe("Graduate");
  });
});

function makeStats(
  overrides: Partial<ConstructorParameters<typeof TextStatistics>[0]> = {},
): TextStatistics {
  return new TextStatistics({
    letterCount: 10,
    wordCount: 10,
    sentenceCount: 1,
    syllableCount: 15,
    polysyllableCount: 3,
    averageSyllablesPerWord: 1.5,
    averageWordsPerSentence: 10.0,
    longWordCount: 2,
    syllableHistogram: new Map([
      [1, 5],
      [2, 3],
      [3, 2],
    ]),
    ...overrides,
  });
}

describe("TextStatisticsHelper", () => {
  it("estimates difficult percentage", () => {
    expect(TextStatisticsHelper.estimateDifficultPercentage(makeStats())).toBe(50.0);
  });

  it("returns zero when all words are easy", () => {
    const stats = makeStats({
      wordCount: 5,
      syllableHistogram: new Map([[1, 5]]),
    });
    expect(TextStatisticsHelper.estimateDifficultPercentage(stats)).toBe(0.0);
  });

  it("returns zero for zero words", () => {
    const stats = makeStats({ wordCount: 0, syllableHistogram: new Map() });
    expect(TextStatisticsHelper.estimateDifficultPercentage(stats)).toBe(0.0);
  });

  it("clamps a negative difficult count to zero", () => {
    const stats = makeStats({ wordCount: 3, syllableHistogram: new Map([[1, 5]]) });
    expect(TextStatisticsHelper.estimateDifficultPercentage(stats)).toBe(0.0);
  });
});
