import { describe, expect, it } from "vitest";

import type { SyllableHeuristics } from "../../../src/language/language.js";
import { HeuristicSyllableCounter } from "../../../src/syllable/heuristicSyllableCounter.js";

const EN_CONFIG: SyllableHeuristics = {
  vowelPattern: "[aeiouy]",
  problemWords: {
    banana: 3,
    beautiful: 3,
  },
  subtractPatterns: ["cial", "tia"],
  addPatterns: ["ia", "io"],
  prefixes: { un: 1, pre: 1 },
  suffixes: { ly: 1, ing: 1 },
};

describe("HeuristicSyllableCounter", () => {
  it("uses problem words", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    expect(hc.countSyllables("banana")).toBe(3);
    expect(hc.countSyllables("beautiful")).toBe(3);
  });

  it("counts prefixes", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    expect(hc.countSyllables("unfair")).toBeGreaterThanOrEqual(2);
  });

  it("counts suffixes", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    expect(hc.countSyllables("kindly")).toBeGreaterThanOrEqual(2);
  });

  it("handles empty and whitespace words", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    expect(hc.countSyllables("")).toBe(0);
    expect(hc.countSyllables("   ")).toBe(0);
  });

  it("reports having rules", () => {
    expect(new HeuristicSyllableCounter(EN_CONFIG).hasRules()).toBe(true);
  });

  it("reports no rules for null config", () => {
    expect(new HeuristicSyllableCounter(null).hasRules()).toBe(false);
  });

  it("hasWord", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    expect(hc.hasWord("banana")).toBe(true);
    expect(hc.hasWord("unknownword")).toBe(false);
    expect(hc.hasWord("  ")).toBe(false);
  });

  it("splits syllables into equal parts", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    const parts = hc.splitSyllables("banana");
    expect(parts.length).toBe(3);
    expect(parts.join("")).toBe("banana");
  });

  it("returns a single-syllable word whole", () => {
    const hc = new HeuristicSyllableCounter(null);
    expect(hc.splitSyllables("cat")).toEqual(["cat"]);
  });

  it("returns empty split for empty word", () => {
    const hc = new HeuristicSyllableCounter(null);
    expect(hc.splitSyllables("")).toEqual([]);
  });

  it("clamps to a minimum of one syllable", () => {
    const hc = new HeuristicSyllableCounter(null);
    expect(hc.countSyllables("bcdfg")).toBe(1);
  });

  it("strips non-word characters", () => {
    const hc = new HeuristicSyllableCounter(EN_CONFIG);
    expect(hc.countSyllables("...")).toBe(1);
  });

  it("splits into one char per syllable when count >= length", () => {
    const hc = new HeuristicSyllableCounter({ vowelPattern: "[aeiou]", problemWords: { ae: 5 } });
    expect(hc.splitSyllables("ae")).toEqual(["a", "e"]);
  });
});

const RU_CONFIG: SyllableHeuristics = {
  vowelPattern: "[аеёиоуыэюя]",
  vowelMode: "individual",
};

describe("HeuristicSyllableCounter (individual vowels)", () => {
  it("counts adjacent vowels separately", () => {
    const hc = new HeuristicSyllableCounter(RU_CONFIG);
    expect(hc.countSyllables("дыхание")).toBe(4);
    expect(hc.countSyllables("беззвучная")).toBe(4);
  });

  it("counts single-vowel words", () => {
    const hc = new HeuristicSyllableCounter(RU_CONFIG);
    expect(hc.countSyllables("молоко")).toBe(3);
    expect(hc.countSyllables("привет")).toBe(2);
    expect(hc.countSyllables("я")).toBe(1);
  });

  it("clamps a no-vowel word to one", () => {
    const hc = new HeuristicSyllableCounter(RU_CONFIG);
    expect(hc.countSyllables("бстрк")).toBe(1);
  });

  it("individual mode reports rules", () => {
    expect(new HeuristicSyllableCounter(RU_CONFIG).hasRules()).toBe(true);
  });

  it("cluster mode is the default", () => {
    const cluster = new HeuristicSyllableCounter({ vowelPattern: "[аеёиоуыэюя]" });
    const individual = new HeuristicSyllableCounter(RU_CONFIG);
    expect(cluster.countSyllables("дыхание")).toBe(3);
    expect(individual.countSyllables("дыхание")).toBe(4);
  });
});
