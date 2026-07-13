# ReadSight (Node.js) — Multilingual Readability Engine

[![CI](https://github.com/MADEVAL/ReadSightJS/actions/workflows/ci.yml/badge.svg)](https://github.com/MADEVAL/ReadSightJS/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@globus.studio/readsight.svg)](https://www.npmjs.com/package/@globus.studio/readsight)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js)](https://nodejs.org/)
[![Languages](https://img.shields.io/badge/languages-86-9cf)](#supported-languages)
[![Formulas](https://img.shields.io/badge/formulas-17-orange)](#readability-formulas)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](#development)

`@globus.studio/readsight` measures text readability across **86 languages**. It implements
**17 readability formulas** with language-specific coefficients and uses the
Frank M. Liang (TeX) hyphenation algorithm for syllable counting — all with
**zero runtime dependencies**. It ships as a dual **ESM + CommonJS** package
with bundled TypeScript types, and all language data and hyphenation patterns
are packaged with the module.

This is a **byte-accurate Node.js port** of the canonical PHP library and its
ports:

- **PHP (canonical):** <https://github.com/MADEVAL/ReadSight>
- **Python port:** <https://github.com/MADEVAL/ReadSightPy>
- **Rust port:** <https://github.com/MADEVAL/ReadSightRS>

Output parity with the reference implementation is verified with golden vectors
generated from the PHP library (see [`tests/golden`](tests/golden)).

## See It in Action

Two texts of almost equal length — a plain sentence and a chunk of legal boilerplate:

```ts
const plain = "We made an app that reads your text. It tells you how easy it is to read. You get a score in one second.";
const legal = "The parties acknowledge that any unauthorized disclosure of confidential information may cause irreparable harm. In such an event, the affected party shall be entitled to seek injunctive relief.";
```

There is no "score everything" call — you loop over the formulas the language
supports and call `score()` for each:

```ts
import { ReadSight } from "@globus.studio/readsight";

const rs = new ReadSight("en-us");

for (const formula of rs.getSupportedFormulas()) {
  const result = rs.score(formula, legal);
  // result.score, result.gradeLevel, result.interpretation
}
```

For both texts that produces (verbatim output of `npm run demo`):

```text
FORMULA                      | Plain text               | Legalese
--------------------------------------------------------------------------------
ari                          | -2.1  Kindergarten       | 13.2  College
coleman_liau                 | -0.4  Kindergarten       | 16.5  Graduate
dale_chall                   | 5.3  5th-6th grade       | 12.2  Graduate
flesch_kincaid_grade_level   | 0.3  1st Grade           | 13.5  College
flesch_reading_ease          | 107.1  Very Easy         | 23.4  Very Hard
gunning_fog                  | 3.2  Very Easy           | 18.5  Extremely Hard
lix                          | 8  Children's Books      | 49.71  Factual Information
smog                         | 3.1  3rd Grade           | 15.2  College
spache                       | 2.3  2nd Grade           | 6.5  Above 4th Grade
```

**17 formulas, 86 languages, one consistent API.** Five of the formulas are
truly universal — **Gunning Fog, SMOG, Coleman-Liau, ARI and LIX** score text in
*every* one of the 86 languages. The remaining **12 are language-aware**, each
carrying its own published coefficients: Flesch Reading Ease and Flesch-Kincaid
span 12 languages, the Wiener Sachtextformel speaks German, Gulpease speaks
Italian, OSMAN speaks Arabic, and the Fernández-Huerta · Szigriszt-Pazos ·
Gutiérrez-Polini · Crawford family handles Spanish. `getSupportedFormulas()`
then hands each language exactly the slice that fits it — **9** formulas for
`en-us`, **11** for `es`, **8** for `de-1996` — so an English-only metric never
lands on a Thai sentence by mistake.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Syllable Counting Modes](#syllable-counting-modes)
- [Examples](#examples)
- [Supported Languages](#supported-languages)
- [Readability Formulas](#readability-formulas)
- [FormulaResult](#formularesult)
- [API Reference](#api-reference)
- [Custom Configuration](#custom-configuration)
- [Architecture](#architecture)
- [Data Sources](#data-sources)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install @globus.studio/readsight
```

**Requirements:** Node.js >= 18. No other runtime dependencies.

Works from both ESM and CommonJS:

```ts
// ESM
import { ReadSight } from "@globus.studio/readsight";
```

```js
// CommonJS
const { ReadSight } = require("@globus.studio/readsight");
```

## Quick Start

```ts
import { ReadSight } from "@globus.studio/readsight";

const engine = new ReadSight("en-us");

// Syllable counting
engine.syllableCount("banana");        // 3
engine.splitSyllables("hyphenation");  // ["hyp", "hen", "ati", "on"]  (heuristic split)
engine.splitWord("hyphenation");       // ["hy", "phen", "ation"]      (TeX hyphenation points)

// Text analysis
const stats = engine.analyze("The quick brown fox jumps over the lazy dog.");
console.log(`Words: ${stats.wordCount}, Syllables: ${stats.syllableCount}`);

// Readability formulas
const fre = engine.fleschReadingEase("The cat sat on the mat. It was a sunny day.");
console.log(`Flesch Reading Ease: ${fre.score} — ${fre.interpretation}`);

const fog = engine.gunningFog("The cat sat on the mat. It was a sunny day.");
console.log(`Gunning Fog: ${fog.score} (grade ${fog.gradeLevel})`);
```

`analyze` (and hence every formula) throws `EmptyTextException` for text without
letters.

## Syllable Counting Modes

ReadSight has three syllable counting modes, configured per language via
`syllableMode` in `data/languages/*.json`:

| Mode | How it works | `count` accuracy | `split` accuracy |
|---|---|---|---|
| **`heuristic`** | Vowel patterns + word list + prefix/suffix rules | exact | ≈ approximate |
| **`tex`** | Frank M. Liang hyphenation algorithm (TeX `.tex` patterns) | ≈ approximate | exact |
| **`composite`** | Heuristic first, TeX as fallback | exact | ≈ approximate (uses heuristic split) |

**80 languages use `tex`**, **2 use `composite`** (`en-us`, `en-gb`), **4 use
`heuristic`** (`ru`, `uk`, `be`, `bg`). The default mode is **`tex`**.

> **Why `tex` count is approximate:** TeX hyphenation patterns are optimised for
> *line-breaking*, not phonetic syllabification. For scripts where **one
> syllable = one vowel** (e.g. Cyrillic Slavic languages), TeX under- or
> over-counts. Those languages use `heuristic` mode with a per-language vowel
> pattern and `"vowelMode": "individual"` so each vowel counts as a syllable.
> `splitWord()` keeps using the exact TeX hyphenator regardless of mode.

### Vowel counting: `vowelMode`

| `vowelMode` | Behaviour | Example |
|---|---|---|
| `"cluster"` *(default)* | Each run of consecutive vowels = 1 syllable | `beau` → 1 |
| `"individual"` | Each vowel letter = 1 syllable (Slavic Cyrillic) | `дыхание` → 4 |

```ts
import { ReadSight } from "@globus.studio/readsight";

const ru = new ReadSight("ru"); // heuristic + vowelMode "individual"
ru.syllableCount("дыхание"); // 4
```

### Example: "hyphenation" in each mode

```ts
const en = new ReadSight("en-us");          // composite mode — heuristic wins
en.syllableCount("hyphenation");    // 4
en.splitSyllables("hyphenation");   // ["hyp", "hen", "ati", "on"]  — heuristic
en.splitWord("hyphenation");        // ["hy", "phen", "ation"]      — TeX

const de = new ReadSight("de-1996"); // tex mode
de.syllableCount("hyphenation");    // 4
de.splitWord("hyphenation");        // ["hy", "phena", "ti", "on"]
```

> **Tip:** `splitWord()` always uses the TeX hyphenator (exact).
> `splitSyllables()` may use the heuristic split (approximate) in
> `composite`/`heuristic` modes.

> **Note:** `addHyphenations()` adds overrides to the TeX hyphenator. These
> affect `splitWord()` but NOT `splitSyllables()` in `composite`/`heuristic`
> modes (the heuristic counter doesn't see them).

## Examples

Run the bundled examples to see ReadSight in action:

```bash
npm run demo                       # readability grid + syllables + statistics
npx tsx examples/demo.ts --lang=de-1996
npx tsx examples/multilingual.ts   # compare a sample across languages
```

## Supported Languages

86 languages across **19 writing systems**: Latin, Cyrillic, Arabic, Hebrew,
Devanagari, Bengali, Tamil, Thai, Greek, Armenian, Georgian, Gujarati, Gurmukhi,
Kannada, Malayalam, Odia, Telugu, Ethiopic, Coptic.

```ts
new ReadSight("ru");       // Russian
new ReadSight("de-1996");  // German (1996 reform)
new ReadSight("es");       // Spanish
new ReadSight("th");       // Thai

// List all supported languages (sorted)
const langs = ReadSight.getSupportedLanguages();
// langs.length === 86
```

## Readability Formulas

### Universal (all 86 languages)

| Formula | `name` key | Method | Type |
|---|---|---|---|
| Gunning Fog | `gunning_fog` | `gunningFog()` | Syllable-based |
| SMOG Index | `smog` | `smogIndex()` | Syllable-based |
| Coleman-Liau | `coleman_liau` | `colemanLiau()` | Letter-based |
| ARI | `ari` | `automatedReadabilityIndex()` | Letter-based |
| LIX | `lix` | `lix()` | Letter-based |

### Language-Specific

| Language(s) | Formulas |
|---|---|
| `en-us`, `en-gb`, `de-*`, `ru`, `es`, `it`, `fr`, `nl`, `pt`, `tr` | Flesch Reading Ease, Flesch-Kincaid Grade Level |
| English (`en-us`, `en-gb`) | Dale-Chall\*, Spache\* |
| German (`de-1996`, `de-1901`, `de-ch-1901`) | Wiener Sachtextformel (4 variants) |
| Spanish (`es`) | Fernández-Huerta, Szigriszt-Pazos, Gutiérrez-Polini, Crawford |
| Italian (`it`) | Gulpease |
| Polish (`pl`) | FOG-PL |
| Arabic (`ar`) | OSMAN |

> \* **Note:** Dale-Chall and Spache use a syllable-based heuristic to estimate
> difficult words (1-syllable ≈ easy). This is a simplified estimation, not the
> original Dale/Spache word lists.

Generic dispatching by name:

```ts
const rs = new ReadSight("de-1996");
rs.score("gunning_fog", "Ein einfacher deutscher Satz. Und noch einer.");

// Wiener Sachtextformel supports variants 1..4
const w = rs.wienerSachtextformel("Ein einfacher deutscher Satz. Und noch einer.", 1);
w.formulaName; // "wiener_sachtextformel_1"
```

## FormulaResult

```ts
result.score;          // number — raw (rounded) formula score
result.gradeLevel;     // number | null — normalized grade level (FKGL, GF, SMOG, CL, ARI, Spache)
result.interpretation; // string — qualitative interpretation ("Easy", "Hard", ...)
result.formulaName;    // string — formula key
result.languageCode;   // string — language code used
result.inputs;         // Record<string, number> — intermediate values for debugging
```

## API Reference

`ReadSight` (aliased as `Engine`) is the entry point.

### Text / syllable methods

```ts
engine.syllableCount(word: string): number
engine.splitWord(word: string): string[]
engine.splitSyllables(word: string): string[]
engine.wordCount(text: string): number
engine.sentenceCount(text: string): number
engine.letterCount(text: string): number
engine.totalSyllables(text: string): number
engine.averageSyllablesPerWord(text: string): number
engine.averageWordsPerSentence(text: string): number
engine.polysyllableCount(text: string, countProperNouns?: boolean): number
engine.wordsWithMoreThanNSyllables(text: string, n: number, countProperNouns?: boolean): number
engine.histogramSyllables(text: string): Map<number, number>
engine.analyze(text: string): TextStatistics
engine.addHyphenations(overrides: Record<string, string>): void
```

### Formula methods

```ts
engine.score(name: string, text: string): FormulaResult
engine.fleschReadingEase(text) / fleschKincaidGradeLevel(text)
engine.gunningFog(text) / smogIndex(text) / colemanLiau(text)
engine.automatedReadabilityIndex(text) / lix(text)
engine.gulpease(text) / fernandezHuerta(text) / szigrisztPazos(text)
engine.gutierrezPolini(text) / crawford(text) / fogPL(text)
engine.daleChall(text) / spache(text) / osman(text)
engine.wienerSachtextformel(text, variant?: number) // variant 1..4
```

### Static

```ts
ReadSight.getSupportedLanguages(config?: Config): string[]
ReadSight.setDefaultConfig(config: Config): void
ReadSight.withConfig(language: string, config: Config): ReadSight
```

## Custom Configuration

```ts
import { Config, ReadSight } from "@globus.studio/readsight";

// Global default (call once at bootstrap, before creating engines)
ReadSight.setDefaultConfig(new Config("/patterns", "/languages", "/cache"));

// Or per-instance
const engine = ReadSight.withConfig("en-us", new Config("/patterns", "/languages", "/cache"));

// Add custom hyphenation rules (affects splitWord, not splitSyllables in composite/heuristic modes)
engine.addHyphenations({ customword: "cus-tom-word" });
engine.splitWord("customword"); // ["cus", "tom", "word"]
```

By default all data is read from the package's `data/` directory and compiled
patterns are cached in the OS cache directory (`%LOCALAPPDATA%`,
`~/Library/Caches`, or `$XDG_CACHE_HOME`).

## Architecture

```text
ReadSight (facade, aliased as Engine)
  ├── TextAnalyzer (syllable counting, text metrics)
  │   ├── SyllableCounter (tex | heuristic | composite)
  │   │   ├── CompositeSyllableCounter (problem words → heuristic, rest → TeX)
  │   │   ├── HeuristicSyllableCounter (vowel patterns + word list, vowelMode)
  │   │   └── TexSyllableCounter → LiangHyphenator (TeX hyphenation)
  │   ├── LiangHyphenator ← TexSource (.tex parser) + collections + JsonPatternCache
  │   └── TextSplitter (word/sentence/letter counting)
  ├── Language (JSON config per language, syllableMode + formula configs)
  └── FormulaRegistry (17 formulas)
      ├── FleschReadingEase / FleschKincaidGradeLevel (lang-specific coefficients)
      ├── GunningFog, SmogIndex, ColemanLiau, ARI, LIX (universal)
      └── WienerSachtextformel, Gulpease, FernandezHuerta, ... (lang-specific)
```

## Data Sources

- **TeX hyphenation patterns**: [hyph-utf8](https://ctan.org/pkg/hyph-utf8) —
  the canonical TeX hyphenation repository maintained by the TeX Users Group.
  86 `.tex` pattern files covering 86 language variants, packaged under each
  file's original license.
- **FRE coefficients**: Amstad (DE), Oborneva (RU), Fernández-Huerta (ES),
  Vacca-Franchina (IT), Kandel-Moles (FR), Douma (NL), Martins (PT), Ateşman (TR).
- **WSTF**: Bamberger & Vanecek (DE). **Gulpease**: GULP, La Sapienza (IT).

## Development

```bash
npm install
npm run build          # tsup → dist/ (ESM + CJS + d.ts)
npm test               # vitest (unit + integration + golden parity)
npm run test:coverage  # coverage report (100% enforced)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run check          # lint + typecheck + tests
npm run verify:parity  # re-derive golden vectors from the PHP reference (needs PHP)
```

Parity with the PHP reference is verified by golden vectors in
[`tests/golden`](tests/golden): the supported-formula lists, `analyze` metrics,
every applicable formula (with `inputs`), and per-word syllable vectors, checked
across all 86 languages with a `1e-9` tolerance.

Those vectors are produced by the canonical PHP library, and
[`tools/verify-parity.php`](tools/verify-parity.php) re-derives every value
directly from the PHP reference to prove they have not drifted. The
[Parity workflow](.github/workflows/parity.yml) runs this check in CI against a
fresh checkout of [`MADEVAL/ReadSight`](https://github.com/MADEVAL/ReadSight).
To run it locally, point `READSIGHT_PHP_DIR` at a clone of the PHP repo:

```bash
READSIGHT_PHP_DIR=/path/to/ReadSight npm run verify:parity
```

## License

MIT — see [LICENSE](LICENSE). Author of the original library: Yevhen Leonidov.
TeX pattern files from hyph-utf8 are packaged under their original licenses (see
individual file headers).
