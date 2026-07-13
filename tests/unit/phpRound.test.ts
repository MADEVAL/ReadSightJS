import { describe, expect, it } from "vitest";

import { phpRound } from "../../src/internal/phpRound.js";

describe("phpRound", () => {
  it("rounds half away from zero (positive)", () => {
    expect(phpRound(2.5)).toBe(3);
    expect(phpRound(0.5)).toBe(1);
    expect(phpRound(1.5)).toBe(2);
  });

  it("rounds half away from zero (negative)", () => {
    expect(phpRound(-2.5)).toBe(-3);
    expect(phpRound(-0.5)).toBe(-1);
    expect(phpRound(-1.5)).toBe(-2);
  });

  it("respects precision", () => {
    expect(phpRound(1.2345, 2)).toBe(1.23);
    expect(phpRound(1.2355, 2)).toBe(1.24);
    expect(phpRound(2.675, 2)).toBe(2.68);
  });

  it("handles zero and integers", () => {
    expect(phpRound(0)).toBe(0);
    expect(phpRound(0, 2)).toBe(0);
    expect(phpRound(5)).toBe(5);
    expect(phpRound(5.0, 3)).toBe(5);
  });

  it("returns non-finite values unchanged", () => {
    expect(phpRound(Infinity)).toBe(Infinity);
    expect(phpRound(-Infinity)).toBe(-Infinity);
    expect(Number.isNaN(phpRound(NaN))).toBe(true);
  });

  it("corrects floating point representation error", () => {
    // 0.1 + 0.2 = 0.30000000000000004
    expect(phpRound(0.1 + 0.2, 1)).toBe(0.3);
    expect(phpRound(1.005, 2)).toBe(1.01);
  });

  it("handles negative precision-like large magnitudes", () => {
    expect(phpRound(12345.6789, 0)).toBe(12346);
    expect(phpRound(-12345.6789, 2)).toBe(-12345.68);
  });

  it("handles very small numbers", () => {
    expect(phpRound(1e-20, 2)).toBe(0);
    expect(phpRound(0.00001, 2)).toBe(0);
  });
});
