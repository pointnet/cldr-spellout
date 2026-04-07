import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

describe("Italian spellout", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("it");
  });

  it.each([
    [1, "uno"],
    [15, "quindici"],
    [20, "venti"],
    [23, "venti\u00ADtr\u00E9"],
    [73, "settanta\u00ADtr\u00E9"],
    [88, "ottant\u00ADotto"],
    [100, "cento"],
    [101, "cento\u00ADuno"],
    [103, "cento\u00ADtr\u00E9"],
    [106, "cento\u00ADsei"],
    [108, "cent\u00ADotto"],
    [127, "cento\u00ADventi\u00ADsette"],
    [181, "cent\u00ADottant\u00ADuno"],
    [200, "due\u00ADcento"],
    [579, "cinque\u00ADcento\u00ADsettanta\u00ADnove"],
    [1000, "mille"],
    [2000, "due\u00ADmila"],
    [3004, "tre\u00ADmila\u00ADquattro"],
    [4567, "quattro\u00ADmila\u00ADcinque\u00ADcento\u00ADsessanta\u00ADsette"],
    [15943, "quindici\u00ADmila\u00ADnove\u00ADcento\u00ADquaranta\u00ADtr\u00E9"],
    [-36, "meno trenta\u00ADsei"],
    [234.567, "due\u00ADcento\u00ADtrenta\u00ADquattro virgola cinque sei sette"],
  ] as [number, string][])('formats %d as "%s"', (n, expected) => {
    expect(fmt.format(n)).toBe(expected);
  });
});
