import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { ReadSight, type FormulaResult } from "../src/index.js";

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), "golden");

const TOL = 1e-9;

function load(name: string): unknown {
  return JSON.parse(readFileSync(join(goldenDir, name), "utf-8"));
}

function approx(a: number, b: number, ctx: string): void {
  const ok = Math.abs(a - b) <= TOL || (Number.isNaN(a) && Number.isNaN(b));
  expect(ok, `${ctx}: got ${a}, expected ${b} (|diff|=${Math.abs(a - b)})`).toBe(true);
}

function optNumber(v: unknown): number | null {
  if (v === null) {
    return null;
  }
  if (typeof v === "number") {
    return v;
  }
  throw new Error(`expected number or null, got ${JSON.stringify(v)}`);
}

interface ExpectedResult {
  formula_name: string;
  language_code: string;
  score: number;
  grade_level: number | null;
  interpretation: string;
  inputs: Record<string, number>;
}

function assertResult(got: FormulaResult, exp: ExpectedResult, ctx: string): void {
  expect(got.formulaName, `${ctx}: formula_name`).toBe(exp.formula_name);
  expect(got.languageCode, `${ctx}: language_code`).toBe(exp.language_code);
  approx(got.score, exp.score, `${ctx}: score`);

  const expGrade = optNumber(exp.grade_level);
  if (got.gradeLevel === null || expGrade === null) {
    expect(got.gradeLevel, `${ctx}: grade_level (${got.gradeLevel} vs ${expGrade})`).toBe(expGrade);
  } else {
    approx(got.gradeLevel, expGrade, `${ctx}: grade_level`);
  }

  expect(got.interpretation, `${ctx}: interpretation`).toBe(exp.interpretation);

  const expInputs = exp.inputs;
  const gotKeys = Object.keys(got.inputs).sort();
  const expKeys = Object.keys(expInputs).sort();
  expect(gotKeys, `${ctx}: inputs keys`).toEqual(expKeys);
  for (const [key, expVal] of Object.entries(expInputs)) {
    const gotVal = got.inputs[key];
    expect(gotVal, `${ctx}: missing input key ${key}`).toBeDefined();
    approx(gotVal!, expVal, `${ctx}: input ${key}`);
  }
}

const SAMPLE_TEXTS: Record<string, string> = {
  latin:
    "The quick brown fox jumps over the lazy dog. This sentence provides a simple readability sample for testing purposes and evaluation.",
  cyrillic:
    "Быстрая коричневая лиса прыгает через ленивую собаку. Это предложение служит хорошим примером для тестирования читабельности текста.",
};

describe("golden parity", () => {
  it("supported languages match (order + values)", () => {
    const expected = load("languages.json") as string[];
    const got = ReadSight.getSupportedLanguages();
    expect(got.length, "expected 86 languages").toBe(86);
    expect(got, "supported languages list").toEqual(expected);
  });

  it("syllable vectors match", () => {
    const golden = load("syllable.json") as Record<
      string,
      {
        syllable_count: Record<string, number>;
        split_word: Record<string, string[]>;
        split_syllables: Record<string, string[]>;
      }
    >;

    for (const [lang, entry] of Object.entries(golden)) {
      const rs = new ReadSight(lang);

      for (const [word, exp] of Object.entries(entry.syllable_count)) {
        expect(rs.syllableCount(word), `${lang} syllable_count(${word})`).toBe(exp);
      }
      for (const [word, exp] of Object.entries(entry.split_word)) {
        expect(rs.splitWord(word), `${lang} split_word(${word})`).toEqual(exp);
      }
      for (const [word, exp] of Object.entries(entry.split_syllables)) {
        expect(rs.splitSyllables(word), `${lang} split_syllables(${word})`).toEqual(exp);
      }
    }
  });

  it("analyze and formula vectors match for all 86 languages", () => {
    const golden = load("analyze.json") as Record<string, GoldenLanguageEntry>;

    for (const [code, entry] of Object.entries(golden)) {
      const rs = new ReadSight(code);

      expect(rs.getSupportedFormulas(), `${code}: supported_formulas`).toEqual(
        entry.supported_formulas,
      );

      for (const textKey of ["latin", "cyrillic"] as const) {
        const block = entry[textKey];
        const text = SAMPLE_TEXTS[textKey]!;
        const ctx = `${code}/${textKey}`;

        const stats = rs.analyze(text);
        const es = block.stats;
        expect(stats.letterCount, `${ctx}: letter_count`).toBe(es.letter_count);
        expect(stats.wordCount, `${ctx}: word_count`).toBe(es.word_count);
        expect(stats.sentenceCount, `${ctx}: sentence_count`).toBe(es.sentence_count);
        expect(stats.syllableCount, `${ctx}: syllable_count`).toBe(es.syllable_count);
        expect(stats.polysyllableCount, `${ctx}: polysyllable_count`).toBe(es.polysyllable_count);
        approx(
          stats.averageSyllablesPerWord,
          es.average_syllables_per_word,
          `${ctx}: average_syllables_per_word`,
        );
        approx(
          stats.averageWordsPerSentence,
          es.average_words_per_sentence,
          `${ctx}: average_words_per_sentence`,
        );
        expect(stats.longWordCount, `${ctx}: long_word_count`).toBe(es.long_word_count);

        const expHist = new Map<number, number>(
          Object.entries(es.syllable_histogram).map(([k, v]) => [Number(k), v]),
        );
        expect(stats.syllableHistogram, `${ctx}: histogram`).toEqual(expHist);

        for (const [fname, exp] of Object.entries(block.formulas)) {
          const got = rs.score(fname, text);
          assertResult(got, exp, `${ctx}: ${fname}`);
        }

        if (block.wiener) {
          for (const [vk, exp] of Object.entries(block.wiener)) {
            const variant = Number(vk.replace(/^v/, ""));
            const got = rs.wienerSachtextformel(text, variant);
            assertResult(got, exp, `${ctx}: wiener v${variant}`);
          }
        }
      }
    }
  });
});

interface GoldenStats {
  letter_count: number;
  word_count: number;
  sentence_count: number;
  syllable_count: number;
  polysyllable_count: number;
  average_syllables_per_word: number;
  average_words_per_sentence: number;
  long_word_count: number;
  syllable_histogram: Record<string, number>;
}

interface GoldenTextBlock {
  stats: GoldenStats;
  formulas: Record<string, ExpectedResult>;
  wiener?: Record<string, ExpectedResult>;
}

interface GoldenLanguageEntry {
  latin: GoldenTextBlock;
  cyrillic: GoldenTextBlock;
  supported_formulas: string[];
}
