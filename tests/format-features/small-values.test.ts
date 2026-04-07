import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Small decimal values — ICU TestSmallValues.
 * Tests that tiny fractions after decimal point are spelled correctly.
 */
describe("Small decimal values", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  it.each([
    [0.001, "zero point zero zero one"],
    [0.0001, "zero point zero zero zero one"],
    [0.00001, "zero point zero zero zero zero one"],
    [0.000001, "zero point zero zero zero zero zero one"],
    [10000000.001, "ten million point zero zero one"],
    [10000000.0001, "ten million point zero zero zero one"],
    [10000000, "ten million"],
    [
      1234567.7654321,
      "one million two hundred thirty-four thousand five hundred sixty-seven point seven six five four three two one",
    ],
    [
      123456.654321,
      "one hundred twenty-three thousand four hundred fifty-six point six five four three two one",
    ],
    [12345.54321, "twelve thousand three hundred forty-five point five four three two one"],
    [1234.4321, "one thousand two hundred thirty-four point four three two one"],
    [123.321, "one hundred twenty-three point three two one"],
  ] as [number, string][])('formats %s as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
