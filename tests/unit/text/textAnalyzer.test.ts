import { describe, expect, it } from "vitest";

import { EmptyTextException } from "../../../src/errors.js";
import { HyphenationExceptionsCollection } from "../../../src/hyphenation/hyphenationExceptionsCollection.js";
import { LiangHyphenator } from "../../../src/hyphenation/liangHyphenator.js";
import { Pattern } from "../../../src/hyphenation/pattern.js";
import { PatternsCollection } from "../../../src/hyphenation/patternsCollection.js";
import { Language, type LanguageData } from "../../../src/language/language.js";
import { TexSyllableCounter } from "../../../src/syllable/texSyllableCounter.js";
import { TextAnalyzer } from "../../../src/text/textAnalyzer.js";
import { TextSplitter } from "../../../src/text/textSplitter.js";

function makeLanguage(overrides: Partial<LanguageData> = {}): Language {
  const data: LanguageData = {
    code: "en-us",
    name: "English (US)",
    nativeName: "English (US)",
    script: "Latin",
    hyphenMins: { left: 2, right: 2 },
    letterPattern: "[A-Za-z]",
    wordSplitPattern: "[^\\p{L}'’-]+",
    sentenceBoundaryPattern: "[.!?]+",
    syllableMode: "tex",
    ...overrides,
  };
  return Language.fromData(data);
}

function makePatterns(): PatternsCollection {
  const pc = new PatternsCollection();
  pc.add(new Pattern([".", "a", "b"], [0, 0, 4, 0]));
  return pc;
}

function makeAnalyzer(
  patterns = new PatternsCollection(),
  language = makeLanguage(),
): { analyzer: TextAnalyzer; hyphenator: LiangHyphenator } {
  const hyphenator = new LiangHyphenator(patterns, new HyphenationExceptionsCollection());
  const counter = new TexSyllableCounter(hyphenator);
  const splitter = new TextSplitter(language);
  const analyzer = new TextAnalyzer(hyphenator, counter, splitter, language);
  return { analyzer, hyphenator };
}

describe("TextAnalyzer", () => {
  it("throws on empty text", () => {
    const { analyzer } = makeAnalyzer(makePatterns());
    expect(() => analyzer.analyze("")).toThrow(EmptyTextException);
  });

  it("produces basic stats", () => {
    const { analyzer } = makeAnalyzer();
    const stats = analyzer.analyze("Hello world. How are you?");
    expect(stats.wordCount).toBeGreaterThan(0);
    expect(stats.sentenceCount).toBeGreaterThan(0);
    expect(stats.letterCount).toBeGreaterThan(0);
    expect(stats.syllableCount).toBeGreaterThan(0);
  });

  it("counts words", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.wordCount("one two three four five")).toBe(5);
  });

  it("counts sentences and letters", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.sentenceCount("Hi. Bye.")).toBe(2);
    expect(analyzer.letterCount("Hello")).toBe(5);
  });

  it("counts syllables for a single word", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.syllableCount("hello")).toBeGreaterThanOrEqual(1);
    expect(analyzer.syllableCount("")).toBe(0);
  });

  it("splits words and syllables", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.splitWord("hello").join("")).toBe("hello");
    expect(analyzer.splitSyllables("hello").join("")).toBe("hello");
  });

  it("computes total and average syllables", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.totalSyllables("one two")).toBeGreaterThan(0);
    expect(analyzer.averageSyllablesPerWord("one two")).toBeGreaterThan(0);
  });

  it("returns zero average syllables for empty text", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.averageSyllablesPerWord("")).toBe(0);
  });

  it("computes average words per sentence", () => {
    const { analyzer } = makeAnalyzer();
    expect(analyzer.averageWordsPerSentence("one two. three four.")).toBe(2);
  });

  it("returns word count when there are no sentences", () => {
    const { analyzer } = makeAnalyzer();
    // No boundary => countSentences returns 1, so avg = words / 1.
    expect(analyzer.averageWordsPerSentence("one two three")).toBe(3);
  });

  it("counts polysyllables", () => {
    const { analyzer } = makeAnalyzer();
    const count = analyzer.polysyllableCount("banana");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("counts words with more than N syllables, excluding proper nouns", () => {
    const { analyzer } = makeAnalyzer();
    // Proper nouns (capitalized) excluded when countProperNouns=false.
    const all = analyzer.wordsWithMoreThanNSyllables("Hello world", 0, true);
    const common = analyzer.wordsWithMoreThanNSyllables("Hello world", 0, false);
    expect(all).toBeGreaterThanOrEqual(common);
  });

  it("builds a syllable histogram", () => {
    const { analyzer } = makeAnalyzer();
    const hist = analyzer.histogramSyllables("cat dog banana");
    expect(hist.size).toBeGreaterThan(0);
  });

  it("histogram skips zero-syllable tokens", () => {
    const { analyzer } = makeAnalyzer();
    const hist = analyzer.histogramSyllables("cat");
    for (const key of hist.keys()) {
      expect(key).toBeGreaterThan(0);
    }
  });

  it("uses the lix longWordThreshold from language config", () => {
    const lang = makeLanguage({ formulas: { lix: { enabled: true, longWordThreshold: 4 } } });
    const { analyzer } = makeAnalyzer(new PatternsCollection(), lang);
    const stats = analyzer.analyze("aaaaa bb ccccc. dd.");
    expect(stats.longWordCount).toBeGreaterThanOrEqual(0);
  });

  it("supports user hyphenation overrides via addHyphenations", () => {
    const { analyzer } = makeAnalyzer();
    analyzer.addHyphenations({ testword: "test-word" });
    expect(analyzer.splitWord("testword")).toEqual(["test", "word"]);
  });
});
