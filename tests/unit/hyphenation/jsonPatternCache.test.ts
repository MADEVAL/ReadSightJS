import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonPatternCache } from "../../../src/hyphenation/cache/jsonPatternCache.js";
import { HyphenationExceptionsCollection } from "../../../src/hyphenation/hyphenationExceptionsCollection.js";
import { HyphenationOverride } from "../../../src/hyphenation/hyphenationOverride.js";
import { Pattern } from "../../../src/hyphenation/pattern.js";
import { PatternsCollection } from "../../../src/hyphenation/patternsCollection.js";

describe("JsonPatternCache", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "readsight-cache-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("sets and gets", () => {
    const cache = new JsonPatternCache(dir);

    const patterns = new PatternsCollection();
    patterns.add(new Pattern(["a", "b"], [0, 4, 0]));
    const exceptions = new HyphenationExceptionsCollection();
    exceptions.add(new HyphenationOverride("test-word", "test-word"));

    cache.set("en-us", { patterns, exceptions, maxPatternLength: 2 });

    expect(cache.has("en-us")).toBe(true);

    const result = cache.get("en-us");
    expect(result).not.toBeNull();
    expect(result!.maxPatternLength).toBe(2);
    expect(result!.patterns.count()).toBe(1);
    expect(result!.patterns.getWeights("ab")).toBe("040");
    expect(result!.exceptions.get("test-word")).toBe("test-word");
  });

  it("has returns false when missing", () => {
    const cache = new JsonPatternCache(dir);
    expect(cache.has("nonexistent")).toBe(false);
  });

  it("get returns null when missing", () => {
    const cache = new JsonPatternCache(dir);
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("clears a single entry", () => {
    const cache = new JsonPatternCache(dir);
    cache.set("en-us", {
      patterns: new PatternsCollection(),
      exceptions: new HyphenationExceptionsCollection(),
      maxPatternLength: 0,
    });
    expect(cache.has("en-us")).toBe(true);
    cache.clear("en-us");
    expect(cache.has("en-us")).toBe(false);
  });

  it("clear on missing entry is a no-op", () => {
    const cache = new JsonPatternCache(dir);
    expect(() => cache.clear("nope")).not.toThrow();
  });

  it("clears all entries", () => {
    const cache = new JsonPatternCache(dir);
    const emptyExc = new HyphenationExceptionsCollection();
    cache.set("en-us", {
      patterns: new PatternsCollection(),
      exceptions: emptyExc,
      maxPatternLength: 0,
    });
    cache.set("ru", {
      patterns: new PatternsCollection(),
      exceptions: emptyExc,
      maxPatternLength: 0,
    });
    cache.clearAll();
    expect(cache.has("en-us")).toBe(false);
    expect(cache.has("ru")).toBe(false);
  });

  it("clearAll on a missing directory is a no-op", () => {
    const cache = new JsonPatternCache(join(dir, "does-not-exist"));
    expect(() => cache.clearAll()).not.toThrow();
  });

  it("returns null for invalid JSON", () => {
    const cache = new JsonPatternCache(dir);
    writeFileSync(join(dir, "syllable.bad.json"), "{ not json", "utf-8");
    expect(cache.get("bad")).toBeNull();
  });

  it("returns null for a version mismatch", () => {
    const cache = new JsonPatternCache(dir);
    writeFileSync(
      join(dir, "syllable.old.json"),
      JSON.stringify({ version: "1.0", patterns: [], exceptions: {}, maxPatternLength: 0 }),
      "utf-8",
    );
    expect(cache.get("old")).toBeNull();
  });

  it("tolerates payload without exceptions", () => {
    const cache = new JsonPatternCache(dir);
    writeFileSync(
      join(dir, "syllable.noexc.json"),
      JSON.stringify({ version: "2.0", patterns: [], maxPatternLength: 0 }),
      "utf-8",
    );
    const result = cache.get("noexc");
    expect(result).not.toBeNull();
    expect(result!.exceptions.count()).toBe(0);
  });
});
