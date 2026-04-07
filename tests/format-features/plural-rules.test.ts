import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Plural rules substitutions — ordinal-style plurals from ICU TestPluralRules.
 */
describe("Ordinal plural rules (English)", () => {
  const rules =
    "%digits-ordinal:\n" +
    "    -x: ->>;" +
    "    0: =#,##0=$(ordinal,one{st}two{nd}few{rd}other{th})$;\n";

  const fmt = new RuleBasedNumberFormat(rules, "en");

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [14, "14th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [24, "24th"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

/**
 * Multiple plural rules — ICU TestMultiplePluralRules.
 * Tests plural substitutions in both integer and fractional parts.
 */
describe("Multiple plural rules", () => {
  const rules =
    "%spellout-cardinal-feminine:\n" +
    "    x.x: [<< $(cardinal,one{singleton}other{plurality})$ ]>%%fractions>;\n" +
    "    0: zero;\n" +
    "    1: one;\n" +
    "    2: two;\n" +
    "%%fractions:\n" +
    "    10: <%spellout-cardinal-feminine< $(cardinal,one{oneth}other{tenth})$;\n" +
    "    100: <%spellout-cardinal-feminine< $(cardinal,one{1hundredth}other{hundredth})$;\n";

  const fmt = new RuleBasedNumberFormat(rules, "en");

  it.each([
    [0, "zero"],
    [1, "one"],
    [2, "two"],
    [0.1, "one oneth"],
    [0.2, "two tenth"],
    [1.1, "one singleton one oneth"],
    [1.2, "one singleton two tenth"],
    [2.1, "two plurality one oneth"],
    [2.2, "two plurality two tenth"],
    [0.01, "one 1hundredth"],
    [0.02, "two hundredth"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
