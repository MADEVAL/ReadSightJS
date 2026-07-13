import { describe, expect, it } from "vitest";

import {
  EmptyTextException,
  PatternFileNotFoundException,
  PatternParseException,
  ReadabilityEngineException,
  UnsupportedFormulaException,
  UnsupportedLanguageException,
} from "../../src/errors.js";

describe("errors", () => {
  it("EmptyTextException.create", () => {
    const e = EmptyTextException.create();
    expect(e).toBeInstanceOf(ReadabilityEngineException);
    expect(e).toBeInstanceOf(EmptyTextException);
    expect(e.name).toBe("EmptyTextException");
    expect(e.message).toBe("Text must contain at least one letter.");
  });

  it("PatternFileNotFoundException.forFile", () => {
    const e = PatternFileNotFoundException.forFile("/x/hyph-en.tex");
    expect(e).toBeInstanceOf(ReadabilityEngineException);
    expect(e.message).toContain("/x/hyph-en.tex");
  });

  it("PatternParseException.withLine", () => {
    const e = PatternParseException.withLine("a1b", 42, "file.tex");
    expect(e.message).toContain("a1b");
    expect(e.message).toContain("42");
    expect(e.message).toContain("file.tex");
  });

  it("UnsupportedFormulaException.forLanguage", () => {
    const e = UnsupportedFormulaException.forLanguage("gulpease", "en-us");
    expect(e.message).toContain("gulpease");
    expect(e.message).toContain("en-us");
  });

  it("UnsupportedLanguageException.withCode", () => {
    const e = UnsupportedLanguageException.withCode("zz");
    expect(e.message).toContain("zz");
  });

  it("base exception is an Error", () => {
    const e = new ReadabilityEngineException("boom");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ReadabilityEngineException");
    expect(e.message).toBe("boom");
  });
});
