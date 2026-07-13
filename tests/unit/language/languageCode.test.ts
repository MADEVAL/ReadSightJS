import { describe, expect, it } from "vitest";

import { LanguageCode } from "../../../src/language/languageCode.js";

describe("LanguageCode", () => {
  it("normalizes to lowercase", () => {
    expect(new LanguageCode("EN-US").value).toBe("en-us");
  });

  it("trims whitespace", () => {
    expect(new LanguageCode("  de-1996  ").value).toBe("de-1996");
  });

  it("equality is case-insensitive", () => {
    expect(new LanguageCode("en-us").equals(new LanguageCode("EN-US"))).toBe(true);
  });

  it("inequality", () => {
    expect(new LanguageCode("en-us").equals(new LanguageCode("de-1996"))).toBe(false);
  });

  it("toString returns the value", () => {
    expect(new LanguageCode("en-us").toString()).toBe("en-us");
  });

  it("static normalize", () => {
    expect(LanguageCode.normalize("  RU ")).toBe("ru");
  });
});
