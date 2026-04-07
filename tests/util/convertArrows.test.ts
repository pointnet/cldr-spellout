import { describe, it, expect } from "vitest";
import { convertArrows } from "../../src/util/convertArrows";

describe("convertArrows", () => {
  it("converts right arrow → to >", () => {
    expect(convertArrows("\u2192")).toBe(">");
    expect(convertArrows("\u2192\u2192")).toBe(">>");
  });

  it("converts left arrow ← to <", () => {
    expect(convertArrows("\u2190")).toBe("<");
    expect(convertArrows("\u2190\u2190")).toBe("<<");
  });

  it("converts minus sign − to -", () => {
    expect(convertArrows("\u2212")).toBe("-");
  });

  it("converts mixed arrows in a rule string", () => {
    const input = "\u2190\u2190 hundred \u2192\u2192";
    expect(convertArrows(input)).toBe("<< hundred >>");
  });

  it("leaves ASCII characters unchanged", () => {
    expect(convertArrows("hello >> world")).toBe("hello >> world");
  });

  it("handles empty string", () => {
    expect(convertArrows("")).toBe("");
  });

  it("converts a realistic CLDR rule", () => {
    const input = "\u2212x: minus \u2192\u2192;";
    expect(convertArrows(input)).toBe("-x: minus >>;");
  });
});
