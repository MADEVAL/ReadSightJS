import { Script } from "./script.js";

/** Per-formula configuration block from a language JSON file. */
export type FormulaConfig = Record<string, unknown>;

/** Heuristic syllable-counting configuration. */
export interface SyllableHeuristics {
  vowelPattern?: string;
  vowelMode?: string;
  problemWords?: Record<string, number>;
  subtractPatterns?: string[];
  addPatterns?: string[];
  prefixes?: Record<string, number>;
  suffixes?: Record<string, number>;
  [key: string]: unknown;
}

/** Raw shape of a `data/languages/<code>.json` file. */
export interface LanguageData {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  hyphenMins: { left: number; right: number };
  letterPattern: string;
  wordSplitPattern: string;
  sentenceBoundaryPattern: string;
  formulas?: Record<string, FormulaConfig>;
  syllableHeuristics?: SyllableHeuristics | null;
  syllableMode?: string;
}

/** Immutable language definition loaded from a JSON file. */
export class Language {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly script: Script;
  readonly minHyphenLeft: number;
  readonly minHyphenRight: number;
  readonly letterPattern: string;
  readonly wordSplitPattern: string;
  readonly sentenceBoundaryPattern: string;
  readonly formulaConfigs: Record<string, FormulaConfig>;
  readonly syllableHeuristics: SyllableHeuristics | null;
  readonly syllableMode: string;

  constructor(params: {
    code: string;
    name: string;
    nativeName: string;
    script: Script;
    minHyphenLeft: number;
    minHyphenRight: number;
    letterPattern: string;
    wordSplitPattern: string;
    sentenceBoundaryPattern: string;
    formulaConfigs: Record<string, FormulaConfig>;
    syllableHeuristics: SyllableHeuristics | null;
    syllableMode: string;
  }) {
    this.code = params.code;
    this.name = params.name;
    this.nativeName = params.nativeName;
    this.script = params.script;
    this.minHyphenLeft = params.minHyphenLeft;
    this.minHyphenRight = params.minHyphenRight;
    this.letterPattern = params.letterPattern;
    this.wordSplitPattern = params.wordSplitPattern;
    this.sentenceBoundaryPattern = params.sentenceBoundaryPattern;
    this.formulaConfigs = params.formulaConfigs;
    this.syllableHeuristics = params.syllableHeuristics;
    this.syllableMode = params.syllableMode;
  }

  static fromData(data: LanguageData): Language {
    return new Language({
      code: data.code,
      name: data.name,
      nativeName: data.nativeName,
      script: data.script as Script,
      minHyphenLeft: data.hyphenMins.left,
      minHyphenRight: data.hyphenMins.right,
      letterPattern: data.letterPattern,
      wordSplitPattern: data.wordSplitPattern,
      sentenceBoundaryPattern: data.sentenceBoundaryPattern,
      formulaConfigs: data.formulas ?? {},
      syllableHeuristics: data.syllableHeuristics ?? null,
      syllableMode: data.syllableMode ?? "tex",
    });
  }

  supportsFormula(formulaName: string): boolean {
    return formulaName in this.formulaConfigs;
  }

  getFormulaConfig(formulaName: string): FormulaConfig | null {
    return this.formulaConfigs[formulaName] ?? null;
  }

  getSupportedFormulas(): string[] {
    return Object.keys(this.formulaConfigs);
  }
}
