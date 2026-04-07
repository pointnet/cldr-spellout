import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRuleSet, INumberFormat } from "../types.js";

/**
 * Returns the absolute value of the number.
 * Used for >> in the negative-number rule (-x).
 *
 * Example: in "-x: minus >>;"
 *   >> is an AbsoluteValueSubstitution that computes abs(number).
 */
export class AbsoluteValueSubstitution extends NFSubstitution {
  constructor(
    pos: number,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    super(pos, ruleSet, description, resolveRuleSet, createNumberFormat);
  }

  tokenChar(): string {
    return ">";
  }

  protected transformNumber(number: number): number {
    return Math.abs(number);
  }

  composeRuleValue(newRuleValue: number, _oldRuleValue: number): number {
    return -newRuleValue;
  }

  calcUpperBound(_oldUpperBound: number): number {
    return Number.MAX_VALUE;
  }
}
