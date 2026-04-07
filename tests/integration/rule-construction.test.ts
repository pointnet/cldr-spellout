import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Rule construction edge cases — adapted from ICU itrbnfp.cpp (TestParse).
 * These rules should construct without crashing, even if results vary.
 */
describe("Malformed / edge-case rule strings", () => {
  it("handles empty rule body gracefully", () => {
    const rules = "%foo:\n    0: ;\n";
    expect(() => new RuleBasedNumberFormat(rules, "en")).not.toThrow();
  });

  it("handles multiple rule sets", () => {
    const rules = "%a:\n    0: zero;\n    1: one;\n" + "%b:\n    0: nil;\n    1: uno;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(fmt.getRuleSetNames()).toContain("%a");
    expect(fmt.getRuleSetNames()).toContain("%b");
  });

  it("handles private rule sets (%%)", () => {
    const rules = "%public:\n    0: >%%private>;\n" + "%%private:\n    0: zero;\n    1: one;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(fmt.getRuleSetNames()).toContain("%public");
    expect(fmt.getRuleSetNames()).not.toContain("%%private");
  });

  it("handles rule with only NaN and Inf specials", () => {
    const rules =
      "%default:\n" + "    NaN: not a number;\n" + "    Inf: infinite;\n" + "    0: =#,##0=;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(fmt.format(NaN)).toBe("not a number");
    expect(fmt.format(Infinity)).toBe("infinite");
    expect(fmt.format(42)).toBe("42");
  });

  it("handles negative rule -x", () => {
    const rules = "%default:\n" + "    -x: minus >>;\n" + "    0: =#,##0=;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(fmt.format(-5)).toBe("minus 5");
    expect(fmt.format(5)).toBe("5");
  });

  it("handles rule with optional text brackets", () => {
    const rules =
      "%spellout:\n" +
      "    0: zero; 1: one; 2: two; 3: three; 4: four; 5: five;\n" +
      "    6: six; 7: seven; 8: eight; 9: nine; 10: ten;\n" +
      "    11: eleven; 12: twelve; 13: thirteen; 14: fourteen; 15: fifteen;\n" +
      "    16: sixteen; 17: seventeen; 18: eighteen; 19: nineteen;\n" +
      "    20: twenty[->>];\n" +
      "    100: << hundred[ >>];\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(fmt.format(20)).toBe("twenty");
    expect(fmt.format(25)).toBe("twenty-five");
    expect(fmt.format(100)).toBe("one hundred");
    expect(fmt.format(105)).toBe("one hundred five");
  });
});
