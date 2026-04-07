import { describe, it, expect } from "vitest";
import { expectedExponent } from "../../src/util/expectedExponent";

describe("expectedExponent", () => {
  it("returns 0 for baseValue < 1", () => {
    expect(expectedExponent(0, 10)).toBe(0);
    expect(expectedExponent(0.5, 10)).toBe(0);
  });

  it("returns 0 for radix 0", () => {
    expect(expectedExponent(100, 0)).toBe(0);
  });

  it("computes floor(log10(baseValue)) for radix 10", () => {
    expect(expectedExponent(1, 10)).toBe(0);
    expect(expectedExponent(9, 10)).toBe(0);
    expect(expectedExponent(10, 10)).toBe(1);
    expect(expectedExponent(99, 10)).toBe(1);
    expect(expectedExponent(100, 10)).toBe(2);
    expect(expectedExponent(999, 10)).toBe(2);
    expect(expectedExponent(1000, 10)).toBe(3);
    expect(expectedExponent(1000000, 10)).toBe(6);
  });

  it("computes floor(log2(baseValue)) for radix 2", () => {
    expect(expectedExponent(1, 2)).toBe(0);
    expect(expectedExponent(2, 2)).toBe(1);
    expect(expectedExponent(3, 2)).toBe(1);
    expect(expectedExponent(4, 2)).toBe(2);
    expect(expectedExponent(8, 2)).toBe(3);
    expect(expectedExponent(1024, 2)).toBe(10);
  });

  it("handles exact powers correctly (no off-by-one)", () => {
    expect(expectedExponent(10000, 10)).toBe(4);
    expect(expectedExponent(100000, 10)).toBe(5);
    expect(expectedExponent(256, 2)).toBe(8);
  });
});
