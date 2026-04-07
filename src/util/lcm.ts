/**
 * Least common multiple of two positive integers.
 * Uses binary GCD (Knuth's algorithm) to avoid overflow concerns.
 */
export function lcm(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;

  // Binary GCD (Stein's algorithm)
  let a = Math.abs(x);
  let b = Math.abs(y);
  const product = a * b;

  // Remove common factors of 2
  let shift = 0;
  while (((a | b) & 1) === 0) {
    a >>>= 1;
    b >>>= 1;
    shift++;
  }
  // Remove remaining factors of 2 from a
  while ((a & 1) === 0) {
    a >>>= 1;
  }
  do {
    while ((b & 1) === 0) {
      b >>>= 1;
    }
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    b -= a;
  } while (b !== 0);

  const gcd = a << shift;
  return product / gcd;
}
