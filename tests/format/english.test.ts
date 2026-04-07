import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("English spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  it.each([
    [1, "one"],
    [2, "two"],
    [15, "fifteen"],
    [20, "twenty"],
    [23, "twenty-three"],
    [73, "seventy-three"],
    [88, "eighty-eight"],
    [100, "one hundred"],
    [106, "one hundred six"],
    [127, "one hundred twenty-seven"],
    [200, "two hundred"],
    [579, "five hundred seventy-nine"],
    [1000, "one thousand"],
    [2000, "two thousand"],
    [3004, "three thousand four"],
    [4567, "four thousand five hundred sixty-seven"],
    [15943, "fifteen thousand nine hundred forty-three"],
    [2345678, "two million three hundred forty-five thousand six hundred seventy-eight"],
    [-36, "minus thirty-six"],
    [234.567, "two hundred thirty-four point five six seven"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

describe("English ordinals", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [7, "7th"],
    [10, "10th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [14, "14th"],
    [20, "20th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [24, "24th"],
    [33, "33rd"],
    [102, "102nd"],
    [312, "312th"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n, "%digits-ordinal")).toBe(expected);
  });
});

/**
 * Duration rules — from ICU TestDurations.
 * These rules are not in the CLDR en.json; they use a custom rule string
 * (see ICU itrbnf.cpp for the original C++ test).
 */
const durationRules =
  "%%seconds:\n" +
  "    0: 0 sec.;\n" +
  "    1: 1 sec.;\n" +
  "    2: =#,##0= sec.;\n" +
  "%%min-sec:\n" +
  "    0: :=00=;\n" +
  "%%hr-min-sec:\n" +
  "    0: :00:00;\n" +
  "    60/60: :<00<>%%min-sec>;\n" +
  "%%hrs:\n" +
  "    0: 0;\n" +
  "    1: 1;\n" +
  "    2: =#,##0=;\n" +
  "%duration:\n" +
  "    0: =%%seconds=;\n" +
  "    60/60: <0<>%%min-sec>;\n" +
  "    3600/3600: <%%hrs<>%%hr-min-sec>;\n";

describe("English durations (custom rules)", () => {
  const fmt = new RuleBasedNumberFormat(durationRules, "en");

  it.each([
    [0, "0 sec."],
    [1, "1 sec."],
    [24, "24 sec."],
    [60, "1:00"],
    [73, "1:13"],
    [145, "2:25"],
    [666, "11:06"],
    [3600, "1:00:00"],
    [3740, "1:02:20"],
    [10293, "2:51:33"],
  ] as [number, string][])('formats %d seconds as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
