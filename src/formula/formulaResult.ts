/** Result of a readability formula calculation. */
export class FormulaResult {
  readonly formulaName: string;
  readonly languageCode: string;
  readonly score: number;
  readonly gradeLevel: number | null;
  readonly interpretation: string;
  readonly inputs: Record<string, number>;

  constructor(params: {
    formulaName: string;
    languageCode: string;
    score: number;
    gradeLevel: number | null;
    interpretation: string;
    inputs?: Record<string, number>;
  }) {
    this.formulaName = params.formulaName;
    this.languageCode = params.languageCode;
    this.score = params.score;
    this.gradeLevel = params.gradeLevel;
    this.interpretation = params.interpretation;
    this.inputs = params.inputs ?? {};
  }
}
