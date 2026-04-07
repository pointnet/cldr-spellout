import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Rounding behavior — mirrors ICU TestDFRounding / TestRounding.
 * DecimalFormat patterns in rules use ROUND_HALF_EVEN by default via Intl.NumberFormat.
 */
describe("DecimalFormat rounding", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  it('formats 0 as "zero"', () => {
    expect(fmt.format(0)).toBe("zero");
  });

  it('formats 0.5 as "zero point five"', () => {
    expect(fmt.format(0.5)).toBe("zero point five");
  });

  it('formats 1.5 as "one point five"', () => {
    expect(fmt.format(1.5)).toBe("one point five");
  });

  it("formats integer parts correctly", () => {
    // Make sure integers are not corrupted by float representation
    expect(fmt.format(100)).toBe("one hundred");
    expect(fmt.format(1000)).toBe("one thousand");
  });
});
