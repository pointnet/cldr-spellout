import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Public API tests — mirrors ICU TestAPI and TestEquals.
 */
describe("getRuleSetNames()", () => {
  it("returns only public rule sets", () => {
    const rules = "%public-a:\n    0: a;\n" + "%public-b:\n    0: b;\n" + "%%private:\n    0: p;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    const names = fmt.getRuleSetNames();
    expect(names).toContain("%public-a");
    expect(names).toContain("%public-b");
    expect(names).not.toContain("%%private");
  });

  it("returns rule set names from loaded locale", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    const names = fmt.getRuleSetNames();
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(n => n.startsWith("%"))).toBe(true);
  });
});

describe("getDefaultRuleSetName()", () => {
  it("prefers %spellout-numbering as default", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    expect(fmt.getDefaultRuleSetName()).toBe("%spellout-numbering");
  });
});

describe("setDefaultRuleSet()", () => {
  it("changes the active rule set used by format()", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    const original = fmt.format(1);
    // Switch to ordinal rule set
    fmt.setDefaultRuleSet("%digits-ordinal");
    expect(fmt.format(1)).toBe("1st");
    // Restore
    fmt.setDefaultRuleSet("%spellout-numbering");
    expect(fmt.format(1)).toBe(original);
  });

  it("throws for unknown rule set name", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    expect(() => fmt.setDefaultRuleSet("%nonexistent")).toThrow();
  });

  it("throws for private rule set name", () => {
    const rules = "%public:\n    0: =#,##0=;\n" + "%%private:\n    0: p;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(() => fmt.setDefaultRuleSet("%%private")).toThrow();
  });
});

describe("format() with explicit ruleSetName", () => {
  it("formats using a specific rule set", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    expect(fmt.format(1, "%spellout-numbering")).toBe("one");
    expect(fmt.format(1, "%digits-ordinal")).toBe("1st");
  });

  it("throws for unknown rule set name", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    expect(() => fmt.format(1, "%nonexistent")).toThrow();
  });

  it("throws for private rule set name", () => {
    const rules = "%public:\n    0: =#,##0=;\n" + "%%private:\n    0: p;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(() => fmt.format(1, "%%private")).toThrow();
  });
});

describe("getRules()", () => {
  it("returns the original rules string", () => {
    const rules = "%spellout:\n    0: zero;\n    1: one;\n";
    const fmt = new RuleBasedNumberFormat(rules, "en");
    expect(fmt.getRules()).toBe(rules);
  });
});

describe("getSupportedLocales()", () => {
  it("is a static method returning an array", () => {
    const locales = RuleBasedNumberFormat.getSupportedLocales();
    expect(Array.isArray(locales)).toBe(true);
    expect(locales.length).toBeGreaterThan(0);
  });

  it("contains expected locales", () => {
    const locales = RuleBasedNumberFormat.getSupportedLocales();
    for (const expected of ["en", "fr", "de", "es", "it", "ja", "zh", "ru"]) {
      expect(locales).toContain(expected);
    }
  });
});
