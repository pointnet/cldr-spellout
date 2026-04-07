import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("Swedish spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("sv");
  });

  it.each([
    [101, "ett\u00adhundra\u00adett"],
    [123, "ett\u00adhundra\u00adtjugo\u00adtre"],
    [1001, "et\u00adtusen ett"],
    [1100, "et\u00adtusen ett\u00adhundra"],
    [1101, "et\u00adtusen ett\u00adhundra\u00adett"],
    [1234, "et\u00adtusen tv\u00e5\u00adhundra\u00adtrettio\u00adfyra"],
    [10001, "tio\u00adtusen ett"],
    [11000, "elva\u00adtusen"],
    [12000, "tolv\u00adtusen"],
    [20000, "tjugo\u00adtusen"],
    [21000, "tjugo\u00adet\u00adtusen"],
    [21001, "tjugo\u00adet\u00adtusen ett"],
    [200000, "tv\u00e5\u00adhundra\u00adtusen"],
    [201000, "tv\u00e5\u00adhundra\u00adet\u00adtusen"],
    [200200, "tv\u00e5\u00adhundra\u00adtusen tv\u00e5\u00adhundra"],
    [2002000, "tv\u00e5 miljoner tv\u00e5\u00adtusen"],
    [
      12345678,
      "tolv miljoner tre\u00adhundra\u00adfyrtio\u00adfem\u00adtusen sex\u00adhundra\u00adsjuttio\u00ad\u00e5tta",
    ],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
