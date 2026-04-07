import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("Spanish spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("es");
  });

  it.each([
    [1, "uno"],
    [6, "seis"],
    [16, "diecis\u00e9is"],
    [20, "veinte"],
    [24, "veinticuatro"],
    [26, "veintis\u00e9is"],
    [73, "setenta y tres"],
    [88, "ochenta y ocho"],
    [100, "cien"],
    [106, "ciento seis"],
    [127, "ciento veintisiete"],
    [200, "doscientos"],
    [579, "quinientos setenta y nueve"],
    [1000, "mil"],
    [2000, "dos mil"],
    [3004, "tres mil cuatro"],
    [4567, "cuatro mil quinientos sesenta y siete"],
    [15943, "quince mil novecientos cuarenta y tres"],
    [2345678, "dos millones trescientos cuarenta y cinco mil seiscientos setenta y ocho"],
    [-36, "menos treinta y seis"],
    [234.567, "doscientos treinta y cuatro coma cinco seis siete"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
