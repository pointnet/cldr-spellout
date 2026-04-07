import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("French spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("fr");
  });

  it.each([
    [1, "un"],
    [15, "quinze"],
    [20, "vingt"],
    [21, "vingt-et-un"],
    [23, "vingt-trois"],
    [62, "soixante-deux"],
    [70, "soixante-dix"],
    [71, "soixante-et-onze"],
    [73, "soixante-treize"],
    [80, "quatre-vingts"],
    [88, "quatre-vingt-huit"],
    [100, "cent"],
    [106, "cent six"],
    [127, "cent vingt-sept"],
    [200, "deux cents"],
    [579, "cinq cent soixante-dix-neuf"],
    [1000, "mille"],
    [1123, "mille cent vingt-trois"],
    [1594, "mille cinq cent quatre-vingt-quatorze"],
    [2000, "deux mille"],
    [3004, "trois mille quatre"],
    [4567, "quatre mille cinq cent soixante-sept"],
    [15943, "quinze mille neuf cent quarante-trois"],
    [2345678, "deux millions trois cent quarante-cinq mille six cent soixante-dix-huit"],
    [-36, "moins trente-six"],
    [234.567, "deux cent trente-quatre virgule cinq six sept"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

describe("Swiss French spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("fr-CH");
  });

  it.each([
    [1, "un"],
    [15, "quinze"],
    [20, "vingt"],
    [21, "vingt-et-un"],
    [23, "vingt-trois"],
    [62, "soixante-deux"],
    [70, "septante"],
    [71, "septante-et-un"],
    [73, "septante-trois"],
    [80, "huitante"],
    [88, "huitante-huit"],
    [100, "cent"],
    [200, "deux cents"],
    [579, "cinq cent septante-neuf"],
    [1000, "mille"],
    [2345678, "deux millions trois cent quarante-cinq mille six cent septante-huit"],
    [-36, "moins trente-six"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

describe("Belgian French spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("fr-BE");
  });

  it.each([
    [1, "un"],
    [15, "quinze"],
    [20, "vingt"],
    [21, "vingt-et-un"],
    [23, "vingt-trois"],
    [62, "soixante-deux"],
    [70, "septante"],
    [71, "septante-et-un"],
    [73, "septante-trois"],
    [80, "quatre-vingts"],
    [90, "nonante"],
    [91, "nonante-et-un"],
    [95, "nonante-cinq"],
    [100, "cent"],
    [200, "deux cents"],
    [-36, "moins trente-six"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
