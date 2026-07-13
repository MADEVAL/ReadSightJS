/**
 * PHP-compatible rounding: "round half away from zero".
 *
 * PHP's `round($value, $precision)` rounds halves away from zero
 * (e.g. `round(2.5) === 3`, `round(-2.5) === -3`), which differs from
 * JavaScript's `Math.round` (rounds half toward +Infinity) and from
 * Python's banker's rounding. All formulas in ReadSight rely on this
 * behaviour, so we replicate it exactly to preserve byte-for-byte parity
 * with the canonical PHP library.
 *
 * @param value - the number to round
 * @param precision - number of decimal places (default 0)
 * @returns the rounded number
 */
export function phpRound(value: number, precision = 0): number {
  if (!Number.isFinite(value)) {
    return value;
  }

  const factor = Math.pow(10, precision);
  const scaled = value * factor;

  // Correct floating-point representation error the same way PHP's
  // "pre-rounding" does, so values like 2.675 * 100 = 267.49999999999997
  // round as if they were exactly 267.5.
  const rounded = roundHalfAwayFromZero(preRound(scaled));

  return rounded / factor;
}

function preRound(value: number): number {
  // Snap to 15 significant digits to absorb binary floating-point noise,
  // mirroring PHP's internal pre-rounding step.
  if (value === 0) {
    return 0;
  }
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const digits = 15 - magnitude;
  if (digits <= 0 || digits > 323) {
    return value;
  }
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function roundHalfAwayFromZero(value: number): number {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}
