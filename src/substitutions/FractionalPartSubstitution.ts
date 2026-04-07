import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRuleSet, INumberFormat, ParsePosition } from "../types.js";

/**
 * Extracts the fractional part of a number.
 * Used for >> in fraction rules (x.x, 0.x, x.0).
 *
 * Has two modes:
 *   - "by digits" (>> or >>>): formats each fractional digit individually
 *     using the owning rule set. >>> omits spaces between digits.
 *   - normal: formats the fractional value as a whole number via the rule set.
 *
 * Example: in "x.x: << point >>;"
 *   >> is a FractionalPartSubstitution that computes number - floor(number).
 */
export class FractionalPartSubstitution extends NFSubstitution {
  private readonly byDigits: boolean;
  private readonly useSpaces: boolean;

  constructor(
    pos: number,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    super(pos, ruleSet, description, resolveRuleSet, createNumberFormat);

    // ">>" or ">>>" with the owning rule set → by-digits mode
    // ">>>" specifically also disables spaces between digits
    if (description === ">>" || description === ">>>") {
      this.byDigits = true;
      this.useSpaces = description !== ">>>";
    } else {
      this.byDigits = false;
      this.useSpaces = true;
      // Named rule set target (e.g., ">%%frac>") must be marked as a fraction rule set
      // so that findFractionRuleSetRule() is used instead of findNormalRule().
      if (this.ruleSet !== null) {
        this.ruleSet.makeIntoFractionRuleSet();
      }
    }
  }

  tokenChar(): string {
    return ">";
  }

  protected transformNumber(number: number): number {
    return number - Math.floor(number);
  }

  composeRuleValue(newRuleValue: number, oldRuleValue: number): number {
    return newRuleValue + oldRuleValue;
  }

  calcUpperBound(_oldUpperBound: number): number {
    return 0;
  }

  /**
   * Override: in by-digits mode, format each fractional digit individually
   * using the owning rule set. Otherwise, use the default behavior.
   */
  doSubstitution(number: number, output: string[], pos: number, recursionCount: number): void {
    if (!this.byDigits || this.ruleSet === null) {
      super.doSubstitution(number, output, pos, recursionCount);
      return;
    }

    // Extract fractional digits from the minimal string representation of the
    // original number. Using toFixed() would introduce IEEE 754 noise digits.
    // String(1.23) = "1.23", String(0.001) = "0.001", etc.
    const numStr = String(Math.abs(number));
    const dotIdx = numStr.indexOf(".");
    if (dotIdx < 0 || number === Math.floor(number)) {
      // No fractional part — emit a single zero
      this.ruleSet.format(0, output, pos + this.getPos(), recursionCount);
      return;
    }

    const fracStr = numStr.substring(dotIdx + 1);
    if (fracStr.length === 0) {
      this.ruleSet.format(0, output, pos + this.getPos(), recursionCount);
      return;
    }

    // Format digits from right to left (LSD first), inserting at the
    // same position each time so they stack up in the correct order.
    let pad = false;
    for (let i = fracStr.length - 1; i >= 0; i--) {
      const digit = parseInt(fracStr[i], 10);
      if (pad && this.useSpaces) {
        output[0] =
          output[0].substring(0, pos + this.getPos()) +
          " " +
          output[0].substring(pos + this.getPos());
      } else {
        pad = true;
      }
      this.ruleSet.format(digit, output, pos + this.getPos(), recursionCount);
    }
  }

  /**
   * Override: in by-digits mode, parse one digit at a time using the
   * owning rule set with an upper bound of 10.
   */
  doParse(
    text: string,
    parsePosition: ParsePosition,
    baseValue: number,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number {
    if (!this.byDigits) {
      return super.doParse(
        text,
        parsePosition,
        baseValue,
        0, // upperBound is always 0 for fraction parsing
        nonNumericalExecutedRuleMask,
        recursionCount,
      );
    }

    if (this.ruleSet === null) {
      return 0;
    }

    let workText = text;
    let result = 0;
    let p10 = 0.1;
    const workPos: ParsePosition = { index: 1, errorIndex: -1 }; // start at 1 to enter loop

    while (workText.length > 0 && workPos.index !== 0) {
      workPos.index = 0;
      workPos.errorIndex = -1;

      const digit = this.ruleSet.parse(
        workText,
        workPos,
        10, // only single digits
        nonNumericalExecutedRuleMask,
        recursionCount,
      );

      if (workPos.index !== 0) {
        result += digit * p10;
        p10 /= 10;
        parsePosition.index += workPos.index;
        workText = workText.substring(workPos.index);

        // Skip spaces between digits
        while (workText.length > 0 && workText[0] === " ") {
          workText = workText.substring(1);
          parsePosition.index += 1;
        }
      }
    }

    return this.composeRuleValue(result, baseValue);
  }
}
