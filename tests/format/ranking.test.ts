import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";
import type { IRBNFData } from "../../src/types";

describe("Ranking system (tutorial)", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    const rankingData: IRBNFData = {
      rbnf: {
        identity: { language: "en" },
        rbnf: {
          RankingRules: {
            "%ranking": [
              ["0", "Unranked;"],
              ["400/400", "Iron >%%iron-levels>;"],
              ["800/800", "Bronze >%%bronze-levels>;"],
              ["1300/1300", "Silver >%%silver-levels>;"],
              ["1900/1900", "Gold >%%gold-levels>;"],
              ["2600/2600", "Platinum >%%platinum-levels>;"],
              ["3400/3400", "Emerald >%%emerald-levels>;"],
              ["4300/4300", "Diamond >%%diamond-levels>;"],
              ["5300/5300", "Master >%%master-levels>;"],
              ["6400/6400", "Grandmaster >%%grandmaster-levels>;"],
              ["7600/7600", "Challenger >%%challenger-levels>;"],
              ["8650", "Challenger 4;"],
            ],
            "%%iron-levels": [["0", "1;"], ["100", "2;"], ["200", "3;"], ["300", "4;"]],
            "%%bronze-levels": [["0", "1;"], ["125", "2;"], ["250", "3;"], ["375", "4;"]],
            "%%silver-levels": [["0", "1;"], ["150", "2;"], ["300", "3;"], ["450", "4;"]],
            "%%gold-levels": [["0", "1;"], ["175", "2;"], ["350", "3;"], ["525", "4;"]],
            "%%platinum-levels": [["0", "1;"], ["200", "2;"], ["400", "3;"], ["600", "4;"]],
            "%%emerald-levels": [["0", "1;"], ["225", "2;"], ["450", "3;"], ["675", "4;"]],
            "%%diamond-levels": [["0", "1;"], ["250", "2;"], ["500", "3;"], ["750", "4;"]],
            "%%master-levels": [["0", "1;"], ["275", "2;"], ["550", "3;"], ["825", "4;"]],
            "%%grandmaster-levels": [["0", "1;"], ["300", "2;"], ["600", "3;"], ["900", "4;"]],
            "%%challenger-levels": [["0", "1;"], ["350", "2;"], ["700", "3;"]],
          },
        },
      },
    };
    fmt = RuleBasedNumberFormat.fromCldrData(rankingData);
  });

  it.each([
    // Unranked boundaries
    [0, "Unranked"],
    [399, "Unranked"],
    // Iron sub-levels (100 XP each)
    [400, "Iron 1"],
    [499, "Iron 1"],
    [500, "Iron 2"],
    [599, "Iron 2"],
    [600, "Iron 3"],
    [699, "Iron 3"],
    [700, "Iron 4"],
    [799, "Iron 4"],
    // Bronze sub-levels (125 XP each)
    [800, "Bronze 1"],
    [924, "Bronze 1"],
    [925, "Bronze 2"],
    [1049, "Bronze 2"],
    [1050, "Bronze 3"],
    [1174, "Bronze 3"],
    [1175, "Bronze 4"],
    [1299, "Bronze 4"],
    // Silver sub-levels (150 XP each)
    [1300, "Silver 1"],
    [1449, "Silver 1"],
    [1450, "Silver 2"],
    [1749, "Silver 3"],
    [1750, "Silver 4"],
    [1899, "Silver 4"],
    // Gold sub-levels (175 XP each)
    [1900, "Gold 1"],
    [2074, "Gold 1"],
    [2075, "Gold 2"],
    [2599, "Gold 4"],
    // Platinum sub-levels (200 XP each)
    [2600, "Platinum 1"],
    [3399, "Platinum 4"],
    // Emerald sub-levels (225 XP each)
    [3400, "Emerald 1"],
    [4299, "Emerald 4"],
    // Diamond sub-levels (250 XP each)
    [4300, "Diamond 1"],
    [5299, "Diamond 4"],
    // Master sub-levels (275 XP each)
    [5300, "Master 1"],
    [6399, "Master 4"],
    // Grandmaster sub-levels (300 XP each)
    [6400, "Grandmaster 1"],
    [7599, "Grandmaster 4"],
    // Challenger sub-levels (350 XP each)
    [7600, "Challenger 1"],
    [7949, "Challenger 1"],
    [7950, "Challenger 2"],
    [8299, "Challenger 2"],
    [8300, "Challenger 3"],
    [8649, "Challenger 3"],
    // Challenger 4 catch-all
    [8650, "Challenger 4"],
    [9999, "Challenger 4"],
  ] as [number, string][])("format(%i) → %s", (xp, expected) => {
    expect(fmt.format(xp)).toBe(expected);
  });
});
