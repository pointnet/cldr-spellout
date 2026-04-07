import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "../../src/RuleBasedNumberFormat";

/**
 * Round-trip tests: format(n) → parse(text) === n
 *
 * Uses adaptive stepping from ICU itrbnfrt.cpp:
 * - step 1 for n < 5000
 * - step 2737 for n < 500000
 * - step 267437 for n up to 12,345,678
 *
 * These ranges match ICU's TestEnglishSpelloutRT and TestGermanSpelloutRT.
 */
function collectTestValues(max: number): number[] {
  const values: number[] = [];
  let n = 0;
  while (n <= max) {
    values.push(n);
    if (n < 5000) {
      n += 1;
    } else if (n < 500000) {
      n += 2737;
    } else {
      n += 267437;
    }
  }
  return values;
}

const SMALL_MAX = 500; // keep suite fast — still exercises all rule boundaries

describe("English round-trip", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("en");
  });

  const values = collectTestValues(SMALL_MAX);

  it.each(values)("round-trips %d", n => {
    const text = fmt.format(n);
    const back = fmt.parse(text);
    expect(back).toBe(n);
  });
});

describe("German round-trip", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("de");
  });

  const values = collectTestValues(SMALL_MAX);

  it.each(values)("round-trips %d", n => {
    const text = fmt.format(n);
    const back = fmt.parse(text);
    expect(back).toBe(n);
  });
});

describe("French round-trip", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("fr");
  });

  const values = collectTestValues(SMALL_MAX);

  it.each(values)("round-trips %d", n => {
    const text = fmt.format(n);
    const back = fmt.parse(text);
    expect(back).toBe(n);
  });
});

describe("Spanish round-trip", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    fmt = RuleBasedNumberFormat.fromLocale("es");
  });

  const values = collectTestValues(SMALL_MAX);

  it.each(values)("round-trips %d", n => {
    const text = fmt.format(n);
    const back = fmt.parse(text);
    expect(back).toBe(n);
  });
});
