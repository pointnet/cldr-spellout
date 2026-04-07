import { describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Infinity and NaN formatting — ICU TestInfinityNaN.
 */
describe("Infinity and NaN with explicit rules", () => {
  const rules =
    "%default:\n" +
    "    -x: minus >>;\n" +
    "    Inf: infinite;\n" +
    "    NaN: not a number;\n" +
    "    0: =#,##0=;\n";

  const fmt = new RuleBasedNumberFormat(rules, "en");

  it('formats 1 as "1"', () => {
    expect(fmt.format(1)).toBe("1");
  });

  it('formats Infinity as "infinite"', () => {
    expect(fmt.format(Infinity)).toBe("infinite");
  });

  it('formats -Infinity as "minus infinite"', () => {
    expect(fmt.format(-Infinity)).toBe("minus infinite");
  });

  it('formats NaN as "not a number"', () => {
    expect(fmt.format(NaN)).toBe("not a number");
  });
});

describe("Infinity and NaN with default fallback (no explicit rules)", () => {
  const rules = "%default:\n" + "    -x: minus >>;\n" + "    0: =#,##0=;\n";

  const fmt = new RuleBasedNumberFormat(rules, "en");

  it("formats Infinity with default symbol", () => {
    // Without an explicit Inf rule, the default infinity rule outputs ∞
    expect(fmt.format(Infinity)).toBe("\u221E");
  });

  it('formats -Infinity as "minus ∞" via negative rule', () => {
    // -x: minus >> → "minus " + format(Infinity) → "minus ∞"
    expect(fmt.format(-Infinity)).toBe("minus \u221E");
  });

  it('formats NaN as "NaN"', () => {
    expect(fmt.format(NaN)).toBe("NaN");
  });
});
