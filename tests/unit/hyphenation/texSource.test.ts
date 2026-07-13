import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PatternFileNotFoundException } from "../../../src/errors.js";
import { TexSource } from "../../../src/hyphenation/source/texSource.js";

describe("TexSource", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "readsight-tex-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeTex(name: string, content: string): string {
    const path = join(dir, name);
    writeFileSync(path, content, "utf-8");
    return path;
  }

  it("throws when the file is missing", () => {
    const source = new TexSource(join(dir, "missing.tex"));
    expect(() => source.load()).toThrow(PatternFileNotFoundException);
  });

  it("parses patterns and hyphenation blocks", () => {
    const path = writeTex(
      "hyph.tex",
      [
        "% a comment line",
        "\\patterns{",
        ".ab4",
        "a1b",
        "b2c3d",
        "}",
        "\\hyphenation{",
        "as-so-ci-ate",
        "ta-ble",
        "}",
      ].join("\n"),
    );
    const source = new TexSource(path);
    const loaded = source.load();

    expect(loaded.patterns.getWeights(".ab")).toBe("0004");
    expect(loaded.patterns.getWeights("ab")).toBe("010");
    expect(loaded.patterns.getWeights("bcd")).toBe("0230");
    expect(loaded.maxPatternLength).toBe(3);

    expect(loaded.exceptions.get("associate")).toBe("as-so-ci-ate");
    expect(loaded.exceptions.get("table")).toBe("ta-ble");
  });

  it("ignores comments inside patterns and unknown commands", () => {
    const path = writeTex(
      "hyph2.tex",
      ["\\message{hello}", "\\patterns{a1b % trailing comment", "c1d", "}"].join("\n"),
    );
    const source = new TexSource(path);
    const loaded = source.load();
    expect(loaded.patterns.getWeights("ab")).toBe("010");
    expect(loaded.patterns.getWeights("cd")).toBe("010");
  });

  it("skips tokens that are all digits or all letters", () => {
    const path = writeTex("hyph3.tex", ["\\patterns{", "abc", "123", "x1y", "}"].join("\n"));
    const source = new TexSource(path);
    const loaded = source.load();
    // "abc" has no digit -> skipped; "123" has no letters -> skipped.
    expect(loaded.patterns.getWeights("abc")).toBeNull();
    expect(loaded.patterns.getWeights("xy")).toBe("010");
  });

  it("handles a trailing backslash with no command", () => {
    const path = writeTex("hyph4.tex", ["\\patterns{", "a1b", "}", "\\"].join("\n"));
    const source = new TexSource(path);
    const loaded = source.load();
    expect(loaded.patterns.getWeights("ab")).toBe("010");
  });

  it("parses UTF-8 / non-Latin patterns", () => {
    const path = writeTex("hyph-ru.tex", ["\\patterns{", "а1б", "}"].join("\n"));
    const source = new TexSource(path);
    const loaded = source.load();
    expect(loaded.patterns.getWeights("аб")).toBe("010");
  });

  it("handles braces outside of a command", () => {
    const path = writeTex("hyph5.tex", ["{ignored}", "\\patterns{", "a1b", "}"].join("\n"));
    const source = new TexSource(path);
    const loaded = source.load();
    expect(loaded.patterns.getWeights("ab")).toBe("010");
  });
});
