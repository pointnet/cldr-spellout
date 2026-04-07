import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("Thai spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("th");
  });

  it.each([
    [0, "\u0e28\u0e39\u0e19\u0e22\u0e4c"],
    [1, "\u0e2b\u0e19\u0e36\u0e48\u0e07"],
    [10, "\u0e2a\u0e34\u0e1a"],
    [11, "\u0e2a\u0e34\u0e1a\u200b\u0e40\u0e2d\u0e47\u0e14"],
    [21, "\u0e22\u0e35\u0e48\u200b\u0e2a\u0e34\u0e1a\u200b\u0e40\u0e2d\u0e47\u0e14"],
    [
      101,
      "\u0e2b\u0e19\u0e36\u0e48\u0e07\u200b\u0e23\u0e49\u0e2d\u0e22\u200b\u0e2b\u0e19\u0e36\u0e48\u0e07",
    ],
  ] as [number, string][])("formats %d", (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

describe("Norwegian spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("no");
  });

  it.each([
    [1, "\u00E9n"],
    [2, "to"],
    [3, "tre"],
    [4, "fire"],
    [101, "hundre og \u00E9n"],
    [123, "hundre og tjue\u00ADtre"],
    [1001, "tusen og \u00E9n"],
    [1100, "tusen hundre"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

describe("Portuguese spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("pt");
  });

  it.each([
    [1, "um"],
    [15, "quinze"],
    [20, "vinte"],
    [23, "vinte e tr\u00EAs"],
    [73, "setenta e tr\u00EAs"],
    [88, "oitenta e oito"],
    [100, "cem"],
    [106, "cento e seis"],
    [200, "duzentos"],
    [1000, "mil"],
    [2000, "dois mil"],
    [-36, "menos trinta e seis"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});

describe("Dutch spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("nl");
  });

  it("formats 1 without error", () => {
    expect(fmt.format(1)).toBeTypeOf("string");
  });

  it("formats 1000 without error", () => {
    expect(fmt.format(1000)).toBeTypeOf("string");
  });
});

describe("Russian spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("ru");
  });

  it("formats 1 without error", () => {
    expect(fmt.format(1)).toBeTypeOf("string");
  });

  it("formats 1000 without error", () => {
    expect(fmt.format(1000)).toBeTypeOf("string");
  });
});

describe("Japanese spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("ja");
  });

  it("formats 1 without error", () => {
    expect(fmt.format(1)).toBeTypeOf("string");
  });

  it("formats 10000 without error", () => {
    expect(fmt.format(10000)).toBeTypeOf("string");
  });
});
