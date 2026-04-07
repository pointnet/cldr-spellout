import { describe, it, expect } from "vitest";
import { pow } from "../../src/util/pow";

describe("pow", () => {
  it("returns 1 for exponent 0", () => {
    expect(pow(10, 0)).toBe(1);
    expect(pow(2, 0)).toBe(1);
    expect(pow(0, 0)).toBe(1);
  });

  it("returns radix for exponent 1", () => {
    expect(pow(10, 1)).toBe(10);
    expect(pow(2, 1)).toBe(2);
    expect(pow(7, 1)).toBe(7);
  });

  it("computes powers of 10", () => {
    expect(pow(10, 2)).toBe(100);
    expect(pow(10, 3)).toBe(1000);
    expect(pow(10, 6)).toBe(1000000);
    expect(pow(10, 9)).toBe(1000000000);
  });

  it("computes powers of 2", () => {
    expect(pow(2, 2)).toBe(4);
    expect(pow(2, 8)).toBe(256);
    expect(pow(2, 10)).toBe(1024);
    expect(pow(2, 16)).toBe(65536);
  });

  it("returns 0 for radix 0 with positive exponent", () => {
    expect(pow(0, 1)).toBe(0);
    expect(pow(0, 5)).toBe(0);
  });
});
