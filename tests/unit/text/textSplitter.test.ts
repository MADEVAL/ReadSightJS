import { describe, expect, it } from "vitest";

import { Language, type LanguageData } from "../../../src/language/language.js";
import { TextSplitter } from "../../../src/text/textSplitter.js";

function makeLanguage(overrides: Partial<LanguageData> = {}): Language {
  const data: LanguageData = {
    code: "en-us",
    name: "English",
    nativeName: "English",
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}'’-]+",
    sentenceBoundaryPattern: "[.!?]+",
    ...overrides,
  };
  return Language.fromData(data);
}

describe("TextSplitter", () => {
  it("splits words", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.splitWords("The quick brown fox")).toEqual(["The", "quick", "brown", "fox"]);
  });

  it("keeps apostrophes inside words", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.splitWords("don't can't it's")).toContain("don't");
  });

  it("handles empty input", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.splitWords("")).toEqual([]);
    expect(ts.splitWords("   ")).toEqual([]);
  });

  it("splits sentences", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.splitSentences("Hello world. How are you?").length).toBe(2);
  });

  it("returns empty sentences for blank input", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.splitSentences("")).toEqual([]);
    expect(ts.splitSentences("   ")).toEqual([]);
  });

  it("counts letters", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countLetters("Hello world")).toBe(10);
  });

  it("counts zero letters for empty input", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countLetters("")).toBe(0);
  });

  it("counts words", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countWords("one two three")).toBe(3);
  });

  it("counts sentences", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countSentences("Hi there. How goes?")).toBe(2);
  });

  it("returns one sentence when no boundary is present", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countSentences("just words")).toBe(1);
  });

  it("returns zero sentences for blank input", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countSentences("")).toBe(0);
  });

  it("counts long words", () => {
    const ts = new TextSplitter(makeLanguage());
    expect(ts.countLongWords("a bb ccc dddd eeeee", 3)).toBe(2);
  });

  it("counts Cyrillic letters with a custom pattern", () => {
    const ts = new TextSplitter(makeLanguage({ code: "ru", letterPattern: "[А-Яа-яЁё]" }));
    expect(ts.countLetters("привет мир")).toBe(9);
  });
});
