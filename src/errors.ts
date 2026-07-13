/** Base exception for all readability engine errors. */
export class ReadabilityEngineException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReadabilityEngineException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a text contains no letters to analyze. */
export class EmptyTextException extends ReadabilityEngineException {
  constructor(message: string) {
    super(message);
    this.name = "EmptyTextException";
  }

  static create(): EmptyTextException {
    return new EmptyTextException("Text must contain at least one letter.");
  }
}

/** Thrown when a TeX pattern file cannot be found. */
export class PatternFileNotFoundException extends ReadabilityEngineException {
  constructor(message: string) {
    super(message);
    this.name = "PatternFileNotFoundException";
  }

  static forFile(filePath: string): PatternFileNotFoundException {
    return new PatternFileNotFoundException(`Pattern file "${filePath}" not found.`);
  }
}

/** Thrown when a TeX pattern token cannot be parsed. */
export class PatternParseException extends ReadabilityEngineException {
  constructor(message: string) {
    super(message);
    this.name = "PatternParseException";
  }

  static withLine(token: string, lineNumber: number, filePath: string): PatternParseException {
    return new PatternParseException(
      `Failed to parse pattern token "${token}" at line ${lineNumber} in "${filePath}".`,
    );
  }
}

/** Thrown when a formula is not supported for the requested language. */
export class UnsupportedFormulaException extends ReadabilityEngineException {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedFormulaException";
  }

  static forLanguage(formulaName: string, languageCode: string): UnsupportedFormulaException {
    return new UnsupportedFormulaException(
      `Formula "${formulaName}" is not supported for language "${languageCode}".`,
    );
  }
}

/** Thrown when a requested language is not available. */
export class UnsupportedLanguageException extends ReadabilityEngineException {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedLanguageException";
  }

  static withCode(languageCode: string): UnsupportedLanguageException {
    return new UnsupportedLanguageException(`Language "${languageCode}" is not supported.`);
  }
}
