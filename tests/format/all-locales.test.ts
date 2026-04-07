import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Smoke test: every supported locale should construct successfully
 * and format a basic set of numbers without throwing.
 *
 * Mirrors ICU's TestAllLocales.
 */
describe("All locales smoke test", () => {
  const locales = RuleBasedNumberFormat.getSupportedLocales();
  const testNumbers = [0, 1, -1, 100, 1000, 1000000];

  for (const locale of locales) {
    describe(`locale: ${locale}`, () => {
      let fmt: RuleBasedNumberFormat | null = null;
      let constructionError: unknown = null;

      beforeAll(() => {
        try {
          fmt = RuleBasedNumberFormat.fromLocale(locale);
        } catch (e) {
          constructionError = e;
        }
      });

      it("constructs without error", () => {
        if (constructionError !== null) {
          // Mark as a known failure with the error message rather than throwing
          console.warn(`Locale ${locale} construction failed:`, constructionError);
        }
        // Soft assertion: log but don't fail the full suite for individual locales
        expect(constructionError).toBeNull();
      });

      it("has at least one rule set", () => {
        if (fmt === null) return; // construction failed, skip
        expect(fmt.getRuleSetNames().length).toBeGreaterThan(0);
      });

      for (const n of testNumbers) {
        it(`formats ${n} without throwing`, () => {
          if (fmt === null) return; // construction failed, skip
          expect(() => fmt!.format(n)).not.toThrow();
          expect(fmt!.format(n)).toBeTypeOf("string");
        });
      }
    });
  }
});
