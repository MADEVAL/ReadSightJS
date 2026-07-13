import { describe, expect, it } from "vitest";

import { HyphenationExceptionsCollection } from "../../../src/hyphenation/hyphenationExceptionsCollection.js";
import { HyphenationOverride } from "../../../src/hyphenation/hyphenationOverride.js";
import { LiangHyphenator } from "../../../src/hyphenation/liangHyphenator.js";
import { Pattern } from "../../../src/hyphenation/pattern.js";
import { PatternsCollection } from "../../../src/hyphenation/patternsCollection.js";

function makeMinimalPatterns(): PatternsCollection {
  const pc = new PatternsCollection();
  pc.add(new Pattern([".", "a", "b"], [0, 0, 4, 0]));
  pc.add(new Pattern(["a", "b", "a", "n"], [0, 5, 0, 0, 0]));
  pc.add(new Pattern([".", "a", "b", "r"], [0, 0, 4, 0, 0]));
  pc.add(new Pattern([".", "a", "b", "e"], [0, 0, 0, 2, 0]));
  pc.add(new Pattern([".", "b", "e"], [0, 0, 3, 0]));
  pc.add(new Pattern([".", "e", "d"], [0, 2, 0, 0]));
  pc.add(new Pattern([".", "e", "d"], [0, 0, 4, 0]));
  pc.add(new Pattern(["e", "d", "i"], [0, 2, 0, 0]));
  return pc;
}

function makeMinimalExceptions(): HyphenationExceptionsCollection {
  const ec = new HyphenationExceptionsCollection();
  ec.add(new HyphenationOverride("associate", "as-so-ci-ate"));
  ec.add(new HyphenationOverride("table", "ta-ble"));
  ec.add(new HyphenationOverride("recognize", "rec-og-nize"));
  return ec;
}

describe("LiangHyphenator", () => {
  it("handles empty word", () => {
    const h = new LiangHyphenator(makeMinimalPatterns(), new HyphenationExceptionsCollection());
    expect(h.hyphenate("")).toEqual([]);
    expect(h.countSyllables("")).toBe(0);
  });

  it("returns short word unchanged", () => {
    const h = new LiangHyphenator(makeMinimalPatterns(), new HyphenationExceptionsCollection());
    expect(h.hyphenate("ab")).toEqual(["ab"]);
  });

  it("uses exception for associate", () => {
    const h = new LiangHyphenator(new PatternsCollection(), makeMinimalExceptions());
    expect(h.hyphenate("associate")).toEqual(["as", "so", "ci", "ate"]);
    expect(h.countSyllables("associate")).toBe(4);
  });

  it("uses exception for table", () => {
    const h = new LiangHyphenator(new PatternsCollection(), makeMinimalExceptions());
    expect(h.hyphenate("table")).toEqual(["ta", "ble"]);
  });

  it("applies user hyphenation overrides", () => {
    const h = new LiangHyphenator(makeMinimalPatterns(), new HyphenationExceptionsCollection());
    h.addHyphenations({ banana: "ba-na-na" });
    expect(h.hyphenate("banana")).toEqual(["ba", "na", "na"]);
  });

  it("user hyphenation is case-insensitive", () => {
    const h = new LiangHyphenator(makeMinimalPatterns(), new HyphenationExceptionsCollection());
    h.addHyphenations({ Hello: "Hel-lo" });
    expect(h.hyphenate("HELLO").length).toBe(2);
  });

  it("handles a single-syllable word", () => {
    const h = new LiangHyphenator(makeMinimalPatterns(), new HyphenationExceptionsCollection());
    const result = h.hyphenate("test");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(h.countSyllables("test")).toBeGreaterThanOrEqual(1);
  });

  it("counts syllables via exceptions", () => {
    const h = new LiangHyphenator(new PatternsCollection(), makeMinimalExceptions());
    expect(h.countSyllables("table")).toBe(2);
    expect(h.countSyllables("associate")).toBe(4);
  });

  it("ignores an exception mapped to null-equivalent (present path)", () => {
    const ec = new HyphenationExceptionsCollection();
    ec.add(new HyphenationOverride("banana", "ba-nan-a"));
    const h = new LiangHyphenator(makeMinimalPatterns(), ec, 2, 2);
    expect(h.hyphenate("banana")).toEqual(["ba", "nan", "a"]);
  });

  it("splits by patterns when no exception applies", () => {
    const h = new LiangHyphenator(makeMinimalPatterns(), new HyphenationExceptionsCollection());
    const parts = h.hyphenate("abandoned");
    expect(parts.join("")).toBe("abandoned");
  });

  it("respects custom hyphen mins", () => {
    const h = new LiangHyphenator(
      makeMinimalPatterns(),
      new HyphenationExceptionsCollection(),
      3,
      3,
    );
    // 5-letter word with mins 3+3 = 6 > 5, returned unchanged.
    expect(h.hyphenate("table")).toEqual(["table"]);
  });
});
