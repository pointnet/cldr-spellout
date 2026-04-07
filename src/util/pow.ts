/**
 * Raise radix to the given exponent using iterative multiplication.
 * Avoids Math.pow rounding issues for integer results.
 */
export function pow(radix: number, exponent: number): number {
  let result = 1;
  for (let i = 0; i < exponent; i++) {
    result *= radix;
  }
  return result;
}
