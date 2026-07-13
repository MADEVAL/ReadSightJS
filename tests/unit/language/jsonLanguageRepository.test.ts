import { describe, expect, it } from "vitest";

import { UnsupportedLanguageException } from "../../../src/errors.js";
import { JsonLanguageRepository } from "../../../src/language/jsonLanguageRepository.js";
import { Language } from "../../../src/language/language.js";
import { defaultLanguagesDir } from "../../../src/internal/dataPaths.js";

const languagesDir = defaultLanguagesDir();

describe("JsonLanguageRepository", () => {
  it("finds and caches", () => {
    const repo = new JsonLanguageRepository(languagesDir);
    const lang = repo.find("en-us");
    expect(lang).toBeInstanceOf(Language);
    expect(lang.code).toBe("en-us");
    const cached = repo.find("en-us");
    expect(cached).toBe(lang);
  });

  it("normalizes the code when finding", () => {
    const repo = new JsonLanguageRepository(languagesDir);
    expect(repo.find("EN-US").code).toBe("en-us");
  });

  it("lists codes", () => {
    const repo = new JsonLanguageRepository(languagesDir);
    const codes = repo.listCodes();
    expect(codes).toContain("en-us");
    expect(codes).toContain("ru");
    expect(codes.length).toBeGreaterThanOrEqual(86);
  });

  it("exists", () => {
    const repo = new JsonLanguageRepository(languagesDir);
    expect(repo.exists("en-us")).toBe(true);
    expect(repo.exists("nonexistent-zz")).toBe(false);
  });

  it("exists returns true for cached language", () => {
    const repo = new JsonLanguageRepository(languagesDir);
    repo.find("en-us");
    expect(repo.exists("EN-US")).toBe(true);
  });

  it("throws for unsupported language", () => {
    const repo = new JsonLanguageRepository(languagesDir);
    expect(() => repo.find("zz-nonexistent")).toThrow(UnsupportedLanguageException);
  });
});
