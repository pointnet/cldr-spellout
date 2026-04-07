import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Basic parse() tests — convert text back to numbers.
 */
describe("parse()", () => {
  const rules =
    "%spellout-numbering:\n" +
    "    -x: minus >>;\n" +
    "    x.x: << point >>;\n" +
    "    0: zero;\n" +
    "    1: one;\n" +
    "    2: two;\n" +
    "    3: three;\n" +
    "    4: four;\n" +
    "    5: five;\n" +
    "    6: six;\n" +
    "    7: seven;\n" +
    "    8: eight;\n" +
    "    9: nine;\n" +
    "    10: ten;\n" +
    "    11: eleven;\n" +
    "    12: twelve;\n" +
    "    13: thirteen;\n" +
    "    14: fourteen;\n" +
    "    15: fifteen;\n" +
    "    16: sixteen;\n" +
    "    17: seventeen;\n" +
    "    18: eighteen;\n" +
    "    19: nineteen;\n" +
    "    20: twenty[->>];\n" +
    "    30: thirty[->>];\n" +
    "    40: forty[->>];\n" +
    "    50: fifty[->>];\n" +
    "    60: sixty[->>];\n" +
    "    70: seventy[->>];\n" +
    "    80: eighty[->>];\n" +
    "    90: ninety[->>];\n" +
    "    100: << hundred[ >>];\n" +
    "    1000: << thousand[ >>];\n";

  const fmt = new RuleBasedNumberFormat(rules, "en");

  it.each([
    ["zero", 0],
    ["one", 1],
    ["fifteen", 15],
    ["twenty", 20],
    ["twenty-three", 23],
    ["one hundred", 100],
    ["one thousand", 1000],
  ] as [string, number][])('parses "%s" as %d', (text, expected) => {
    expect(fmt.parse(text)).toBe(expected);
  });
});
