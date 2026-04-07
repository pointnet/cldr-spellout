import { pow } from "./pow.js";

/**
 * Calculate the highest power of `radix` that is <= `baseValue`.
 * Equivalent to floor(log(baseValue) / log(radix)), with correction
 * for floating-point rounding errors.
 */
export function expectedExponent(baseValue: number, radix: number): number {
  if (radix === 0 || baseValue < 1) return 0;
  let exp = Math.floor(Math.log(baseValue) / Math.log(radix));
  // Correct for floating-point rounding: if radix^(exp+1) still fits, bump up
  if (pow(radix, exp + 1) <= baseValue) {
    exp += 1;
  }
  return exp;
}
