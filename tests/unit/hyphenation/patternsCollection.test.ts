import { describe, expect, it } from "vitest";

import { Pattern } from "../../../src/hyphenation/pattern.js";
import { PatternsCollection } from "../../../src/hyphenation/patternsCollection.js";

describe("PatternsCollection", () => {
  it("adds and gets weights", () => {
    const pc = new PatternsCollection();
    pc.add(new Pattern(["a", "b"], [0, 4, 0]));
    expect(pc.getWeights("ab")).toBe("040");
  });

  it("tracks max length", () => {
    const pc = new PatternsCollection();
    pc.add(new Pattern(["a"], [0, 0]));
    pc.add(new Pattern(["a", "b", "c"], [0, 0, 4, 0]));
    expect(pc.maxLength()).toBe(3);
  });

  it("counts", () => {
    const pc = new PatternsCollection();
    pc.add(new Pattern(["a"], [0, 0]));
    pc.add(new Pattern(["b"], [0, 0]));
    expect(pc.count()).toBe(2);
  });

  it("reports emptiness", () => {
    const pc = new PatternsCollection();
    expect(pc.isEmpty()).toBe(true);
    pc.add(new Pattern(["a"], [0, 0]));
    expect(pc.isEmpty()).toBe(false);
  });

  it("returns null for missing weights", () => {
    const pc = new PatternsCollection();
    expect(pc.getWeights("nonexistent")).toBeNull();
  });

  it("all returns a plain object copy", () => {
    const pc = new PatternsCollection();
    pc.add(new Pattern(["x", "y"], [1, 2, 3]));
    expect(pc.all()).toEqual({ xy: "123" });
  });
});
