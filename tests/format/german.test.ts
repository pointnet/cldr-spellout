import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("German spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("de");
  });

  it.each([
    [1, "eins"],
    [15, "f\u00fcnfzehn"],
    [20, "zwanzig"],
    [23, "drei\u00ADund\u00ADzwanzig"],
    [73, "drei\u00ADund\u00ADsiebzig"],
    [88, "acht\u00ADund\u00ADachtzig"],
    [100, "ein\u00ADhundert"],
    [106, "ein\u00ADhundert\u00ADsechs"],
    [127, "ein\u00ADhundert\u00ADsieben\u00ADund\u00ADzwanzig"],
    [200, "zwei\u00ADhundert"],
    [579, "f\u00fcnf\u00ADhundert\u00ADneun\u00ADund\u00ADsiebzig"],
    [1000, "ein\u00ADtausend"],
    [1101, "ein\u00adtausend\u00adein\u00adhundert\u00adeins"],
    [2000, "zwei\u00ADtausend"],
    [3004, "drei\u00ADtausend\u00ADvier"],
    [4567, "vier\u00ADtausend\u00ADf\u00fcnf\u00ADhundert\u00ADsieben\u00ADund\u00ADsechzig"],
    [15943, "f\u00fcnfzehn\u00ADtausend\u00ADneun\u00ADhundert\u00ADdrei\u00ADund\u00ADvierzig"],
    [
      2345678,
      "zwei Millionen drei\u00ADhundert\u00ADf\u00fcnf\u00ADund\u00ADvierzig\u00ADtausend\u00ADsechs\u00ADhundert\u00ADacht\u00ADund\u00ADsiebzig",
    ],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
