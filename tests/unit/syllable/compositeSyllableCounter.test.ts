import { describe, expect, it } from "vitest";

import { HyphenationExceptionsCollection } from "../../../src/hyphenation/hyphenationExceptionsCollection.js";
import { LiangHyphenator } from "../../../src/hyphenation/liangHyphenator.js";
import { Pattern } from "../../../src/hyphenation/pattern.js";
import { PatternsCollection } from "../../../src/hyphenation/patternsCollection.js";
import { CompositeSyllableCounter } from "../../../src/syllable/compositeSyllableCounter.js";
import { HeuristicSyllableCounter } from "../../../src/syllable/heuristicSyllableCounter.js";
import { TexSyllableCounter } from "../../../src/syllable/texSyllableCounter.js";

function makeTexCounter(): TexSyllableCounter {
  const pc = new PatternsCollection();
  pc.add(new Pattern([".", "a", "b"], [0, 0, 4, 0]));
  const lh = new LiangHyphenator(pc, new HyphenationExceptionsCollection());
  return new TexSyllableCounter(lh);
}

describe("CompositeSyllableCounter", () => {
  it("uses the heuristic counter when it has rules", () => {
    const hc = new HeuristicSyllableCounter({
      vowelPattern: "[aeiouy]",
      problemWords: { test: 5 },
    });
    const composite = new CompositeSyllableCounter([hc, makeTexCounter()]);
    expect(composite.countSyllables("test")).toBe(5);
  });

  it("falls back to TeX when heuristic has no rules", () => {
    const hc = new HeuristicSyllableCounter(null);
    const composite = new CompositeSyllableCounter([hc, makeTexCounter()]);
    expect(composite.countSyllables("test")).toBeGreaterThanOrEqual(1);
  });

  it("splits syllables with the heuristic counter", () => {
    const hc = new HeuristicSyllableCounter({
      vowelPattern: "[aeiouy]",
      problemWords: { banana: 3 },
    });
    const composite = new CompositeSyllableCounter([hc, makeTexCounter()]);
    expect(composite.splitSyllables("banana").length).toBe(3);
  });

  it("splits syllables via the fallback", () => {
    const hc = new HeuristicSyllableCounter(null);
    const composite = new CompositeSyllableCounter([hc, makeTexCounter()]);
    expect(composite.splitSyllables("test").length).toBeGreaterThanOrEqual(1);
  });

  it("counts via last counter when chain has only a no-rule heuristic", () => {
    const composite = new CompositeSyllableCounter([new HeuristicSyllableCounter(null)]);
    expect(composite.countSyllables("test")).toBe(1);
  });

  it("splits via last counter when chain has only a no-rule heuristic", () => {
    const composite = new CompositeSyllableCounter([new HeuristicSyllableCounter(null)]);
    expect(composite.splitSyllables("test")).toEqual(["test"]);
  });

  it("returns fallback default for an empty chain (count)", () => {
    const composite = new CompositeSyllableCounter([]);
    expect(composite.countSyllables("test")).toBe(1);
  });

  it("returns fallback default for an empty chain (split)", () => {
    const composite = new CompositeSyllableCounter([]);
    expect(composite.splitSyllables("test")).toEqual(["test"]);
  });
});

describe("TexSyllableCounter", () => {
  it("delegates counting and splitting to the hyphenator", () => {
    const counter = makeTexCounter();
    expect(counter.countSyllables("abab")).toBeGreaterThanOrEqual(1);
    expect(counter.splitSyllables("abab").join("")).toBe("abab");
  });
});
