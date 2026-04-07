import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";
import enData from "cldr-rbnf/rbnf/en.json";
import frData from "cldr-rbnf/rbnf/fr.json";

/**
 * Integration tests for cldr-rbnf JSON loading.
 * Tests fromCldrData() and fromLocale() factories.
 */
describe("fromLocale()", () => {
  it("loads English locale", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("en");
    expect(fmt).toBeInstanceOf(RuleBasedNumberFormat);
    expect(fmt.format(42)).toBe("forty-two");
  });

  it("loads French locale", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("fr");
    expect(fmt).toBeInstanceOf(RuleBasedNumberFormat);
    expect(fmt.format(42)).toBe("quarante-deux");
  });

  it("loads German locale", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("de");
    expect(fmt).toBeInstanceOf(RuleBasedNumberFormat);
    expect(fmt.format(1)).toBe("eins");
  });

  it("loads regional variant fr-CH", () => {
    const fmt = RuleBasedNumberFormat.fromLocale("fr-CH");
    expect(fmt).toBeInstanceOf(RuleBasedNumberFormat);
    // Swiss French: 70 = septante (not soixante-dix)
    expect(fmt.format(70)).toBe("septante");
  });

  it("throws for unsupported locale", () => {
    expect(() => RuleBasedNumberFormat.fromLocale("xx-INVALID")).toThrow("Unsupported locale");
  });
});

describe("fromCldrData()", () => {
  it("constructs from raw JSON data", () => {
    const fmt = RuleBasedNumberFormat.fromCldrData(enData as never);
    expect(fmt).toBeInstanceOf(RuleBasedNumberFormat);
    expect(fmt.format(1)).toBe("one");
  });

  it("accepts locale override", () => {
    const fmt = RuleBasedNumberFormat.fromCldrData(enData as never, "en-US");
    expect(fmt.format(1)).toBe("one");
  });

  it("derives locale from JSON identity when not provided", () => {
    const fmt = RuleBasedNumberFormat.fromCldrData(frData as never);
    expect(fmt.format(70)).toBe("soixante-dix");
  });
});

describe("getSupportedLocales()", () => {
  it("returns a non-empty list", () => {
    const locales = RuleBasedNumberFormat.getSupportedLocales();
    expect(locales.length).toBeGreaterThan(0);
  });

  it("includes common locales", () => {
    const locales = RuleBasedNumberFormat.getSupportedLocales();
    expect(locales).toContain("en");
    expect(locales).toContain("fr");
    expect(locales).toContain("de");
    expect(locales).toContain("es");
    expect(locales).toContain("it");
  });
});
