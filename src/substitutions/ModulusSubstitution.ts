import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRule, INFRuleSet, INumberFormat, ParsePosition } from "../types.js";
import { pow } from "../util/pow.js";

/**
 * Returns the remainder after dividing by the rule's divisor.
 * Represented by >> in normal (non-fraction) rules,
 * or >>> for predecessor short-circuit.
 *
 * Example: in "100: << hundred >>;"
 *   >> is a ModulusSubstitution that computes number % 100.
 *
 * The >>> variant bypasses rule search and formats directly
 * using the predecessor rule (used for place-value notations
 * where you want to see a digit even when it's 0).
 */
export class ModulusSubstitution extends NFSubstitution {
  private divisor: number;
  private readonly ruleToUse: INFRule | null;

  constructor(
    pos: number,
    rule: INFRule,
    predecessor: INFRule | null,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    super(pos, ruleSet, description, resolveRuleSet, createNumberFormat);
    this.divisor = rule.getDivisor();
    if (this.divisor === 0) {
      throw new Error("ModulusSubstitution: divisor cannot be 0");
    }
    // >>> short-circuits to the predecessor rule
    this.ruleToUse = description === ">>>" ? predecessor : null;
  }

  setDivisor(radix: number, exponent: number): void {
    this.divisor = pow(radix, exponent);
    if (this.divisor === 0) {
      throw new Error("ModulusSubstitution: divisor cannot be 0");
    }
  }

  isModulusSubstitution(): boolean {
    return true;
  }

  tokenChar(): string {
    return ">";
  }

  protected transformNumber(number: number): number {
    return number % this.divisor;
  }

  composeRuleValue(newRuleValue: number, oldRuleValue: number): number {
    return oldRuleValue - (oldRuleValue % this.divisor) + newRuleValue;
  }

  calcUpperBound(_oldUpperBound: number): number {
    return this.divisor;
  }

  /**
   * Override: if this is a >>> substitution, format using the predecessor
   * rule directly instead of searching the rule set.
   */
  doSubstitution(number: number, output: string[], pos: number, recursionCount: number): void {
    if (this.ruleToUse === null) {
      super.doSubstitution(number, output, pos, recursionCount);
    } else {
      const numberToFormat = this.transformNumber(number);
      this.ruleToUse.doFormat(numberToFormat, output, pos + this.getPos(), recursionCount);
    }
  }

  /**
   * Override: if this is a >>> substitution, parse using the predecessor
   * rule directly.
   */
  doParse(
    text: string,
    parsePosition: ParsePosition,
    baseValue: number,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number {
    if (this.ruleToUse === null) {
      return super.doParse(
        text,
        parsePosition,
        baseValue,
        upperBound,
        nonNumericalExecutedRuleMask,
        recursionCount,
      );
    }

    // >>> short-circuit: parse using the predecessor rule directly
    const tempResult = this.ruleToUse.doParse(
      text,
      parsePosition,
      false,
      upperBound,
      nonNumericalExecutedRuleMask,
      recursionCount + 1,
    );

    if (parsePosition.index !== 0) {
      return this.composeRuleValue(tempResult, baseValue);
    }
    return 0;
  }

  toString(): string {
    if (this.ruleToUse !== null) {
      return ">>>";
    }
    return super.toString();
  }
}
