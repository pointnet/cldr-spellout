import { describe, it, expect } from "vitest";
import { createPluralFormat } from "../../src/util/pluralFormat";

describe("createPluralFormat", () => {
  it('selects "one" category for singular', () => {
    const pf = createPluralFormat("en", "cardinal", "one{st}other{th}");
    expect(pf.format(1)).toBe("st");
  });

  it('selects "other" category for plural', () => {
    const pf = createPluralFormat("en", "cardinal", "one{st}other{th}");
    expect(pf.format(5)).toBe("th");
  });

  it('falls back to "other" when category not found', () => {
    const pf = createPluralFormat("en", "cardinal", "other{items}");
    expect(pf.format(1)).toBe("items");
  });

  it("handles ordinal type", () => {
    const pf = createPluralFormat("en", "ordinal", "one{st}two{nd}few{rd}other{th}");
    expect(pf.format(1)).toBe("st");
    expect(pf.format(2)).toBe("nd");
    expect(pf.format(3)).toBe("rd");
    expect(pf.format(4)).toBe("th");
  });

  it("handles multiple plural categories (Russian-style)", () => {
    const pf = createPluralFormat("ru", "cardinal", "one{тысяча}few{тысячи}other{тысяч}");
    expect(pf.format(1)).toBe("тысяча");
    expect(pf.format(2)).toBe("тысячи");
    expect(pf.format(5)).toBe("тысяч");
  });

  it("returns empty string when no branches match", () => {
    const pf = createPluralFormat("en", "cardinal", "");
    expect(pf.format(1)).toBe("");
  });
});
