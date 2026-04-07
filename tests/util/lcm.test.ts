import { describe, it, expect } from "vitest";
import { lcm } from "../../src/util/lcm";

describe("lcm", () => {
  it("returns 0 when either input is 0", () => {
    expect(lcm(0, 5)).toBe(0);
    expect(lcm(5, 0)).toBe(0);
    expect(lcm(0, 0)).toBe(0);
  });

  it("returns the larger value when one divides the other", () => {
    expect(lcm(3, 6)).toBe(6);
    expect(lcm(4, 12)).toBe(12);
    expect(lcm(1, 7)).toBe(7);
  });

  it("computes lcm of coprime numbers", () => {
    expect(lcm(3, 5)).toBe(15);
    expect(lcm(7, 11)).toBe(77);
    expect(lcm(4, 9)).toBe(36);
  });

  it("computes lcm of numbers with common factors", () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(6, 8)).toBe(24);
    expect(lcm(12, 18)).toBe(36);
  });

  it("is commutative", () => {
    expect(lcm(4, 6)).toBe(lcm(6, 4));
    expect(lcm(7, 13)).toBe(lcm(13, 7));
  });

  it("handles equal inputs", () => {
    expect(lcm(5, 5)).toBe(5);
    expect(lcm(1, 1)).toBe(1);
  });
});
