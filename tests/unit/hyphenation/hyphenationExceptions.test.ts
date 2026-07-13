import { describe, expect, it } from "vitest";

import { HyphenationExceptionsCollection } from "../../../src/hyphenation/hyphenationExceptionsCollection.js";
import { HyphenationOverride } from "../../../src/hyphenation/hyphenationOverride.js";

describe("HyphenationExceptionsCollection", () => {
  it("adds and checks presence", () => {
    const ec = new HyphenationExceptionsCollection();
    ec.add(new HyphenationOverride("test", "te-st"));
    expect(ec.has("test")).toBe(true);
    expect(ec.has("nonexistent")).toBe(false);
  });

  it("gets", () => {
    const ec = new HyphenationExceptionsCollection();
    ec.add(new HyphenationOverride("hello", "hel-lo"));
    expect(ec.get("hello")).toBe("hel-lo");
    expect(ec.get("nope")).toBeNull();
  });

  it("counts", () => {
    const ec = new HyphenationExceptionsCollection();
    expect(ec.count()).toBe(0);
    ec.add(new HyphenationOverride("a", "a"));
    ec.add(new HyphenationOverride("b", "b"));
    expect(ec.count()).toBe(2);
  });

  it("reports emptiness", () => {
    const ec = new HyphenationExceptionsCollection();
    expect(ec.isEmpty()).toBe(true);
    ec.add(new HyphenationOverride("a", "a"));
    expect(ec.isEmpty()).toBe(false);
  });

  it("returns all as a plain object", () => {
    const ec = new HyphenationExceptionsCollection();
    ec.add(new HyphenationOverride("foo", "fo-o"));
    expect(ec.all()).toEqual({ foo: "fo-o" });
  });
});
