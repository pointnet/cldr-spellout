import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRule, INFRuleSet, INumberFormat } from "../types.js";
import { pow } from "../util/pow.js";

/**
 * Divides the number by the rule's divisor (radix^exponent).
 * Represented by << in normal (non-fraction) rules.
 *
 * Example: in "100: << hundred >>;"
 *   << is a MultiplierSubstitution that computes floor(number / 100).
 */
export class MultiplierSubstitution extends NFSubstitution {
  private divisor: number;
  private readonly owningRule: INFRule;

  constructor(
    pos: number,
    rule: INFRule,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    super(pos, ruleSet, description, resolveRuleSet, createNumberFormat);
    this.divisor = rule.getDivisor();
    this.owningRule = rule;
    if (this.divisor === 0) {
      throw new Error("MultiplierSubstitution: divisor cannot be 0");
    }
  }

  setDivisor(radix: number, exponent: number): void {
    this.divisor = pow(radix, exponent);
    if (this.divisor === 0) {
      throw new Error("MultiplierSubstitution: divisor cannot be 0");
    }
  }

  tokenChar(): string {
    return "<";
  }

  protected transformNumber(number: number): number {
    // When the owning rule has a modulus substitution (or we're formatting
    // via a rule set), floor the division so the modulus sub handles the
    // remainder. Otherwise, pass the unrounded quotient so a DecimalFormat
    // pattern can round properly (e.g., "1/1000: <0<K;").
    if (this.ruleSet !== null || this.owningRule.hasModulusSubstitution()) {
      return Math.floor(number / this.divisor);
    }
    return number / this.divisor;
  }

  composeRuleValue(newRuleValue: number, _oldRuleValue: number): number {
    return newRuleValue * this.divisor;
  }

  calcUpperBound(_oldUpperBound: number): number {
    return this.divisor;
  }
}
