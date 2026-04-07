import { NFSubstitution } from "../NFSubstitution.js";
import type { INFRuleSet, INumberFormat } from "../types.js";

/**
 * Passes the value through unchanged. Represented by == in rules.
 * E.g., "=%spellout-cardinal=" delegates to another rule set
 * without transforming the number.
 */
export class SameValueSubstitution extends NFSubstitution {
  constructor(
    pos: number,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    super(pos, ruleSet, description, resolveRuleSet, createNumberFormat);
    if (description === "==") {
      throw new Error("== is not a legal token");
    }
  }

  tokenChar(): string {
    return "=";
  }

  protected transformNumber(number: number): number {
    return number;
  }

  composeRuleValue(newRuleValue: number, _oldRuleValue: number): number {
    return newRuleValue;
  }

  calcUpperBound(oldUpperBound: number): number {
    return oldUpperBound;
  }
}
