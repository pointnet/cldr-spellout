import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRuleSet, INumberFormat, ParsePosition } from "../types.js";

/**
 * Computes the numerator for fraction rules.
 * Used for << in fraction rule sets (e.g., %%frac).
 *
 * Transforms the number by multiplying it by the rule's base value
 * (the denominator), so the result is the numerator of the fraction.
 *
 * When withZeros is true (token ends with "<<"), leading zeros are
 * emitted for the numerator (e.g., 1/100 → "one one-hundredth"
 * vs. "zero zero one one-hundredth").
 */
export class NumeratorSubstitution extends NFSubstitution {
  private readonly denominator: number;
  private readonly withZeros: boolean;

  constructor(
    pos: number,
    denominator: number,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    // If description ends with "<<", strip one "<" before passing to super.
    // The C++ code does: fixdesc strips trailing "<" so "<<<" becomes "<<"
    // which is a valid paired token for the base constructor.
    const fixedDesc = description.endsWith("<<")
      ? description.substring(0, description.length - 1)
      : description;
    super(pos, ruleSet, fixedDesc, resolveRuleSet, createNumberFormat);
    this.denominator = denominator;
    this.withZeros = description.endsWith("<<");
  }

  tokenChar(): string {
    return "<";
  }

  protected transformNumber(number: number): number {
    return Math.round(number * this.denominator);
  }

  composeRuleValue(newRuleValue: number, oldRuleValue: number): number {
    return newRuleValue / oldRuleValue;
  }

  calcUpperBound(_oldUpperBound: number): number {
    return this.denominator;
  }

  /**
   * Override: if withZeros, emit leading zeros before the numerator
   * (e.g., for 1/100, emit "zero zero" before "one").
   */
  doSubstitution(number: number, output: string[], pos: number, recursionCount: number): void {
    const numberToFormat = this.transformNumber(number);

    if (this.withZeros && this.ruleSet !== null) {
      // Emit leading zeros: multiply numerator by 10 until it
      // reaches the denominator, emitting a zero for each step.
      let nf = numberToFormat;
      const lenBefore = output[0].length;
      while (nf * 10 < this.denominator) {
        output[0] =
          output[0].substring(0, pos + this.getPos()) +
          " " +
          output[0].substring(pos + this.getPos());
        this.ruleSet.format(0, output, pos + this.getPos(), recursionCount);
        nf *= 10;
      }
      // Adjust pos to account for inserted zeros
      const insertedLen = output[0].length - lenBefore;
      const adjustedPos = pos + insertedLen;

      if (this.ruleSet !== null) {
        this.ruleSet.format(numberToFormat, output, adjustedPos + this.getPos(), recursionCount);
      }
    } else {
      // No leading zeros — just use base class behavior
      super.doSubstitution(number, output, pos, recursionCount);
    }
  }

  /**
   * Override: if withZeros, count leading zeros in the text before
   * parsing the actual numerator, and adjust the result accordingly.
   */
  doParse(
    text: string,
    parsePosition: ParsePosition,
    baseValue: number,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number {
    if (!this.withZeros || this.ruleSet === null) {
      // Turn off lenient parsing for numerator substitutions
      return super.doParse(
        text,
        parsePosition,
        baseValue,
        upperBound,
        nonNumericalExecutedRuleMask,
        recursionCount,
      );
    }

    // Count leading zeros
    let workText = text;
    let zeroCount = 0;
    const workPos: ParsePosition = { index: 1, errorIndex: -1 };

    while (workText.length > 0 && workPos.index !== 0) {
      workPos.index = 0;
      workPos.errorIndex = -1;

      // Parse zero or nothing (upper bound = 1 means only 0 matches)
      this.ruleSet.parse(workText, workPos, 1, nonNumericalExecutedRuleMask, recursionCount);

      if (workPos.index === 0) break;

      zeroCount++;
      parsePosition.index += workPos.index;
      workText = workText.substring(workPos.index);

      // Skip spaces
      while (workText.length > 0 && workText[0] === " ") {
        workText = workText.substring(1);
        parsePosition.index += 1;
      }
    }

    // Now parse the actual numerator
    workPos.index = 0;
    workPos.errorIndex = -1;
    const tempResult = this.ruleSet.parse(
      workText,
      workPos,
      upperBound,
      nonNumericalExecutedRuleMask,
      recursionCount,
    );

    if (workPos.index !== 0) {
      parsePosition.index += workPos.index;

      // Adjust for leading zeros: each zero means one more decimal place
      let result = tempResult;
      for (let i = 0; i < zeroCount; i++) {
        result /= 10;
      }

      return this.composeRuleValue(result, baseValue);
    }

    return 0;
  }
}
