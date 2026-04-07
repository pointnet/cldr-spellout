import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Fractional rule sets — formats numbers as fractions (1/2, 1/4, etc.)
 * Uses a raw rule string adapted from ICU TestFractionalRuleSet.
 */
const fracRules =
  "%main:\n" +
  "    x.0: <#,##0<[ >%%frac>];\n" +
  "    0.x: >%%frac>;\n" +
  "%%frac:\n" +
  "    2: 1/2;\n" +
  "    3: <0</3;\n" +
  "    4: <0</4;\n" +
  "    5: <0</5;\n" +
  "    6: <0</6;\n" +
  "    7: <0</7;\n" +
  "    8: <0</8;\n" +
  "    9: <0</9;\n" +
  "   10: <0</10;\n";

describe("Fractional rule sets", () => {
  const fmt = new RuleBasedNumberFormat(fracRules, "en");

  it.each([
    [0, "0"],
    [0.1, "1/10"],
    [0.125, "1/8"],
    [0.2, "1/5"],
    [0.25, "1/4"],
    [0.333, "1/3"],
    [0.5, "1/2"],
    [1.1, "1 1/10"],
    [2.125, "2 1/8"],
    [3.5, "3 1/2"],
    [7.25, "7 1/4"],
    [9.5, "9 1/2"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
