import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("Negative number formatting", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  it.each([
    [-1, "minus one"],
    [-15, "minus fifteen"],
    [-36, "minus thirty-six"],
    [-100, "minus one hundred"],
    [-1000, "minus one thousand"],
    [-2345678, "minus two million three hundred forty-five thousand six hundred seventy-eight"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
