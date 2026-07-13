# Changelog

All notable changes to ReadSight (Node.js) will be documented in this file.

## [1.0.0] - 2026-07-13

### Added

- Initial release — Node.js/TypeScript port of ReadSight (PHP), verified for
  byte-accurate parity against the canonical library via golden vectors.
- Frank M. Liang (TeX) hyphenation algorithm for syllable counting.
- 86 languages across 19 writing systems.
- 17 readability formulas: Flesch Reading Ease, Flesch-Kincaid Grade Level,
  Gunning Fog, SMOG, Coleman-Liau, ARI, LIX, Gulpease, Wiener Sachtextformel
  (4 variants), Fernández-Huerta, Szigriszt-Pazos, Gutiérrez-Polini, Crawford,
  FOG-PL, Dale-Chall, Spache, OSMAN.
- Three syllable-counting modes: `tex`, `heuristic` (with `vowelMode`
  `cluster`/`individual`), and `composite`.
- Vowel-based syllable counting for Russian (`ru`), Ukrainian (`uk`),
  Belarusian (`be`) and Bulgarian (`bg`).
- JSON pattern cache in the OS cache directory.
- Language-specific formula coefficients.
- Text analysis (word/sentence/letter/syllable counts, syllable histogram).
- User-defined hyphenation overrides.
- Interactive `demo` and `multilingual` examples.
- Dual ESM + CommonJS builds with bundled TypeScript declarations.
- Zero runtime dependencies.
- 276 tests (unit + integration + golden parity) with 100% coverage.
- GitHub Actions CI pipeline (Node 18/20/22) and provenance-based publishing.
