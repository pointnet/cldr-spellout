import type { NFSubstitution } from "../NFSubstitution.js";
import {
  AbsoluteValueSubstitution,
  FractionalPartSubstitution,
  IntegralPartSubstitution,
  ModulusSubstitution,
  MultiplierSubstitution,
  NumeratorSubstitution,
  SameValueSubstitution,
} from "../substitutions/index.js";
import { RuleType } from "../types.js";
import type { IFormatter, INFRule, INFRuleSet } from "../types.js";

/**
 * Factory function that creates the right NFSubstitution subclass
 * based on the token character and the rule/ruleSet context.
 *
 * This mirrors C++ NFSubstitution::makeSubstitution().
 *
 * @param pos         Position in the owning rule's ruleText
 * @param rule        The owning rule (provides baseValue, getDivisor)
 * @param predecessor The rule preceding this one (used by >>> short-circuit)
 * @param ruleSet     The owning rule set
 * @param formatter   The top-level formatter (provides resolveRuleSet, createNumberFormat)
 * @param description The full substitution token (e.g., "<<", ">>", "=%spellout-cardinal=")
 * @returns The substitution instance, or null if description is empty
 */
export function makeSubstitution(
  pos: number,
  rule: INFRule,
  predecessor: INFRule | null,
  ruleSet: INFRuleSet,
  formatter: IFormatter,
  description: string,
): NFSubstitution | null {
  if (description.length === 0) return null;

  const resolve = (name: string) => formatter.resolveRuleSet(name);
  const createFmt = (pattern: string) => formatter.createNumberFormat(pattern);
  const baseValue = rule.baseValue;

  switch (description[0]) {
    case "<":
      if (baseValue === RuleType.NegativeNumber) {
        throw new Error("<< not allowed in negative-number rule");
      }
      if (
        baseValue === RuleType.ImproperFraction ||
        baseValue === RuleType.ProperFraction ||
        baseValue === RuleType.Default
      ) {
        return new IntegralPartSubstitution(pos, ruleSet, description, resolve, createFmt);
      }
      if (ruleSet.isFractionRuleSet()) {
        return new NumeratorSubstitution(pos, baseValue, ruleSet, description, resolve, createFmt);
      }
      return new MultiplierSubstitution(pos, rule, ruleSet, description, resolve, createFmt);

    case ">":
      if (baseValue === RuleType.NegativeNumber) {
        return new AbsoluteValueSubstitution(pos, ruleSet, description, resolve, createFmt);
      }
      if (
        baseValue === RuleType.ImproperFraction ||
        baseValue === RuleType.ProperFraction ||
        baseValue === RuleType.Default
      ) {
        return new FractionalPartSubstitution(pos, ruleSet, description, resolve, createFmt);
      }
      if (ruleSet.isFractionRuleSet()) {
        throw new Error(">> not allowed in fraction rule set");
      }
      return new ModulusSubstitution(
        pos,
        rule,
        predecessor,
        ruleSet,
        description,
        resolve,
        createFmt,
      );

    case "=":
      return new SameValueSubstitution(pos, ruleSet, description, resolve, createFmt);

    default:
      throw new Error(`Illegal substitution character: ${description[0]}`);
  }
}
