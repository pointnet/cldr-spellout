import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRuleSet, INumberFormat } from "../types.js";

/**
 * Extracts the integral part of a number (floor).
 * Used for << in fraction rules (x.x, 0.x, x.0).
 *
 * Example: in "x.x: << point >>;"
 *   << is an IntegralPartSubstitution that computes floor(number).
 */
export class IntegralPartSubstitution extends NFSubstitution {
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
    return "<";
  }

  protected transformNumber(number: number): number {
    return Math.floor(number);
  }

  composeRuleValue(newRuleValue: number, oldRuleValue: number): number {
    return newRuleValue + oldRuleValue;
  }

  calcUpperBound(_oldUpperBound: number): number {
    return Number.MAX_VALUE;
  }
}
