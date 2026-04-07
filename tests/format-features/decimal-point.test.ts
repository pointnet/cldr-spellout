import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Variable decimal point — ICU TestVariableDecimalPoint.
 * Tests that rules can substitute a word for the decimal point.
 */
// Only the dot-separator variants — the last rule registered for each
// slot (ImproperFraction / ProperFraction) wins.
const rules =
  "%spellout-numbering:\n" +
  "    -x: minus >>;\n" +
  "    x.x: << point >>;\n" +
  "    0.x: xpoint >>;\n" +
  "    0: zero;\n" +
  "    1: one;\n" +
  "    2: two;\n" +
  "    3: three;\n" +
  "    4: four;\n" +
  "    5: five;\n" +
  "    6: six;\n" +
  "    7: seven;\n" +
  "    8: eight;\n" +
  "    9: nine;\n";

describe("Variable decimal point", () => {
  const fmt = new RuleBasedNumberFormat(rules, "en");

  it.each([
    [1.1, "one point one"],
    [1.23, "one point two three"],
    [0.4, "xpoint four"],
  ] as [number, string][])('formats %d as "%s" (point)', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
