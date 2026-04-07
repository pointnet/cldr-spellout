import { describe, it, expect } from "vitest";
import { createNumberFormat } from "../../src/util/numberFormat";

describe("createNumberFormat", () => {
  describe("format", () => {
    it("formats with plain integer pattern", () => {
      const fmt = createNumberFormat("en", "0");
      expect(fmt.format(42)).toBe("42");
      expect(fmt.format(0)).toBe("0");
    });

    it("formats with zero-padded pattern", () => {
      const fmt = createNumberFormat("en", "00");
      expect(fmt.format(5)).toBe("05");
      expect(fmt.format(42)).toBe("42");
    });

    it("formats with grouping pattern", () => {
      const fmt = createNumberFormat("en", "#,##0");
      expect(fmt.format(1000)).toBe("1,000");
      expect(fmt.format(1000000)).toBe("1,000,000");
    });

    it("formats with decimal pattern", () => {
      const fmt = createNumberFormat("en", "0.0");
      expect(fmt.format(1.5)).toBe("1.5");
      expect(fmt.format(1)).toBe("1.0");
    });

    it("formats with optional decimal pattern", () => {
      const fmt = createNumberFormat("en", "0.#");
      expect(fmt.format(1.5)).toBe("1.5");
      expect(fmt.format(1)).toBe("1");
    });
  });

  describe("parse", () => {
    it("parses plain integers", () => {
      const fmt = createNumberFormat("en", "0");
      const pos = { index: 0, errorIndex: -1 };
      expect(fmt.parse("42", pos)).toBe(42);
      expect(pos.index).toBe(2);
    });

    it("parses negative numbers", () => {
      const fmt = createNumberFormat("en", "0");
      const pos = { index: 0, errorIndex: -1 };
      expect(fmt.parse("-36", pos)).toBe(-36);
      expect(pos.index).toBe(3);
    });

    it("parses grouped numbers", () => {
      const fmt = createNumberFormat("en", "#,##0");
      const pos = { index: 0, errorIndex: -1 };
      expect(fmt.parse("1,000", pos)).toBe(1000);
      expect(pos.index).toBe(5);
    });

    it("parses decimal numbers", () => {
      const fmt = createNumberFormat("en", "0.0");
      const pos = { index: 0, errorIndex: -1 };
      expect(fmt.parse("3.14", pos)).toBe(3.14);
      expect(pos.index).toBe(4);
    });

    it("sets errorIndex on empty input", () => {
      const fmt = createNumberFormat("en", "0");
      const pos = { index: 0, errorIndex: -1 };
      expect(fmt.parse("abc", pos)).toBe(0);
      expect(pos.errorIndex).toBe(0);
    });
  });
});
