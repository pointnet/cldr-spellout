import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("Large number formatting", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  it.each([
    [1000000, "one million"],
    [1000000000, "one billion"],
    [1000000000000, "one trillion"],
    [2345678, "two million three hundred forty-five thousand six hundred seventy-eight"],
    [
      9007199254740991,
      "nine quadrillion seven trillion one hundred ninety-nine billion two hundred fifty-four million seven hundred forty thousand nine hundred ninety-one",
    ],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
