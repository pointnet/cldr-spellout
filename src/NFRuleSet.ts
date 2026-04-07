import { NFRule } from "./NFRule.js";
import { RuleType } from "./types.js";
import type { IFormatter, INFRule, INFRuleSet, ParsePosition } from "./types.js";
import { lcm } from "./util/lcm.js";

/** Maximum recursion depth to prevent stack overflow. */
const RECURSION_LIMIT = 64;

/**
 * Indices into the nonNumericalRules array.
 * Maps RuleType sentinels to array positions.
 */
const NEGATIVE_RULE_INDEX = 0;
const IMPROPER_FRACTION_RULE_INDEX = 1;
const PROPER_FRACTION_RULE_INDEX = 2;
const DEFAULT_RULE_INDEX = 3;
const INFINITY_RULE_INDEX = 4;
const NAN_RULE_INDEX = 5;
const NON_NUMERICAL_RULE_LENGTH = 6;

/**
 * A single named rule set in a RuleBasedNumberFormat.
 *
 * Each rule set contains a sorted list of normal rules (keyed by base value)
 * and up to 6 special rules (negative, fraction variants, infinity, NaN).
 * It knows how to format a number by selecting the appropriate rule and
 * delegating, and how to parse text back into a number by trying each rule.
 *
 * Mirrors ICU4C NFRuleSet (nfrs.h / nfrs.cpp).
 */
export class NFRuleSet implements INFRuleSet {
  private readonly name: string;
  private rules: NFRule[] = [];
  private readonly nonNumericalRules: (NFRule | null)[] = new Array(NON_NUMERICAL_RULE_LENGTH).fill(
    null,
  );
  private readonly owner: IFormatter;
  private fIsFractionRuleSet: boolean = false;
  private readonly fIsPublic: boolean;
  private readonly fIsParseable: boolean;

  /**
   * Construct a rule set by extracting its name from descriptions[index].
   *
   * The name is everything before the first ':'. If the description doesn't
   * start with '%', the name defaults to "%default".
   *
   * Does NOT parse rules — caller must invoke parseRules() separately
   * (two-phase init, same as C++).
   *
   * @param owner        The parent formatter
   * @param descriptions Array of rule set description strings
   * @param index        Which description to use
   */
  constructor(owner: IFormatter, descriptions: string[], index: number) {
    this.owner = owner;

    let description = descriptions[index];
    if (description.length === 0) {
      throw new Error("Empty rule set description");
    }

    // Extract rule set name (optional, begins with '%')
    let name: string;
    if (description[0] === "%") {
      const colonPos = description.indexOf(":");
      if (colonPos < 2) {
        throw new Error("Rule set name doesn't end in colon");
      }
      name = description.substring(0, colonPos);
      // Skip colon + trailing whitespace
      let pos = colonPos + 1;
      while (pos < description.length && /\s/.test(description[pos])) {
        pos++;
      }
      description = description.substring(pos);
    } else {
      name = "%default";
    }

    if (description.length === 0) {
      throw new Error("Empty rule set description");
    }

    // Check for @noparse suffix
    if (name.endsWith("@noparse")) {
      this.fIsParseable = false;
      name = name.substring(0, name.length - 8);
    } else {
      this.fIsParseable = true;
    }

    // Public if name doesn't start with "%%"
    this.fIsPublic = !name.startsWith("%%");
    this.name = name;

    // Store the stripped description back so parseRules can use it
    descriptions[index] = description;
  }

  // ==================================================================
  // Rule parsing
  // ==================================================================

  /**
   * Parse a semicolon-delimited description string into rules.
   *
   * After creating individual rules via NFRule.makeRules(), a second pass
   * assigns default base values to rules that didn't specify one, and
   * validates ascending order.
   */
  parseRules(description: string): void {
    this.rules = [];

    // Split by semicolons and create rules
    let oldP = 0;
    while (oldP < description.length) {
      let p = description.indexOf(";", oldP);
      if (p === -1) {
        p = description.length;
      }
      const currentDescription = description.substring(oldP, p);
      if (currentDescription.trim().length > 0) {
        const last = this.rules.length > 0 ? this.rules[this.rules.length - 1] : null;
        const newRules = NFRule.makeRules(currentDescription, this, last, this.owner);
        for (const rule of newRules) {
          this.rules.push(rule);
        }
      }
      oldP = p + 1;
    }

    // Second pass: assign default base values
    let defaultBaseValue = 0;
    for (const rule of this.rules) {
      const baseValue = rule.baseValue;

      if (baseValue === 0) {
        rule.setBaseValue(defaultBaseValue);
      } else {
        if (baseValue < defaultBaseValue) {
          throw new Error("Rules are not in order");
        }
        defaultBaseValue = baseValue;
      }
      if (!this.fIsFractionRuleSet) {
        defaultBaseValue++;
      }
    }
  }

  // ==================================================================
  // Special rule management
  // ==================================================================

  /**
   * Register a special (non-numerical) rule.
   * Routes the rule to the correct slot based on its baseValue.
   */
  setNonNumericalRule(rule: INFRule): void {
    const nfRule = rule as NFRule;
    switch (nfRule.baseValue) {
      case RuleType.NegativeNumber:
        this.nonNumericalRules[NEGATIVE_RULE_INDEX] = nfRule;
        return;
      case RuleType.ImproperFraction:
        this.nonNumericalRules[IMPROPER_FRACTION_RULE_INDEX] = nfRule;
        return;
      case RuleType.ProperFraction:
        this.nonNumericalRules[PROPER_FRACTION_RULE_INDEX] = nfRule;
        return;
      case RuleType.Default:
        this.nonNumericalRules[DEFAULT_RULE_INDEX] = nfRule;
        return;
      case RuleType.Infinity:
        this.nonNumericalRules[INFINITY_RULE_INDEX] = nfRule;
        return;
      case RuleType.NaN:
        this.nonNumericalRules[NAN_RULE_INDEX] = nfRule;
        return;
      default:
        // Unknown special rule type — discard silently
        return;
    }
  }

  /** Mark this as a fraction rule set (e.g., %%frac). */
  makeIntoFractionRuleSet(): void {
    this.fIsFractionRuleSet = true;
  }

  // ==================================================================
  // Formatting
  // ==================================================================

  /**
   * Format a number by finding the appropriate rule and delegating.
   * Handles both integer and double values.
   */
  format(number: number, output: string[], pos: number, recursionCount: number): void {
    if (recursionCount >= RECURSION_LIMIT) {
      throw new Error("Recursion limit exceeded in RBNF formatting");
    }

    const rule = Number.isInteger(number)
      ? this.findNormalRule(number)
      : this.findDoubleRule(number);

    if (rule !== null) {
      rule.doFormat(number, output, pos, recursionCount + 1);
    }
  }

  /**
   * Find the appropriate rule for a double (possibly fractional) number.
   *
   * Priority chain:
   * 1. Fraction rule set → findFractionRuleSetRule()
   * 2. NaN → NaN rule or owner's default
   * 3. Negative → negative rule (or negate and continue)
   * 4. Infinity → infinity rule or owner's default
   * 5. Has fractional part → proper or improper fraction rule
   * 6. Default rule
   * 7. Fallback → findNormalRule(round(number))
   */
  private findDoubleRule(number: number): NFRule | null {
    if (this.fIsFractionRuleSet) {
      return this.findFractionRuleSetRule(number);
    }

    // NaN
    if (Number.isNaN(number)) {
      return (
        this.nonNumericalRules[NAN_RULE_INDEX] ?? (this.owner.getDefaultNaNRule() as NFRule | null)
      );
    }

    // Negative
    if (number < 0) {
      if (this.nonNumericalRules[NEGATIVE_RULE_INDEX]) {
        return this.nonNumericalRules[NEGATIVE_RULE_INDEX];
      }
      number = -number;
    }

    // Infinity
    if (!Number.isFinite(number)) {
      return (
        this.nonNumericalRules[INFINITY_RULE_INDEX] ??
        (this.owner.getDefaultInfinityRule() as NFRule | null)
      );
    }

    // Fractional number
    if (number !== Math.floor(number)) {
      if (number < 1 && this.nonNumericalRules[PROPER_FRACTION_RULE_INDEX]) {
        return this.nonNumericalRules[PROPER_FRACTION_RULE_INDEX];
      }
      if (this.nonNumericalRules[IMPROPER_FRACTION_RULE_INDEX]) {
        return this.nonNumericalRules[IMPROPER_FRACTION_RULE_INDEX];
      }
    }

    // Default rule
    if (this.nonNumericalRules[DEFAULT_RULE_INDEX]) {
      return this.nonNumericalRules[DEFAULT_RULE_INDEX];
    }

    // Fallback to normal rule search
    return this.findNormalRule(Math.round(number));
  }

  /**
   * Find the appropriate rule for an integer via binary search.
   *
   * Rules are sorted ascending by baseValue. We find the rule whose
   * baseValue is <= the number, then check shouldRollBack().
   */
  private findNormalRule(number: number): NFRule | null {
    if (this.fIsFractionRuleSet) {
      return this.findFractionRuleSetRule(number);
    }

    // Handle negatives
    if (number < 0) {
      if (this.nonNumericalRules[NEGATIVE_RULE_INDEX]) {
        return this.nonNumericalRules[NEGATIVE_RULE_INDEX];
      }
      number = -number;
    }

    const hi = this.rules.length;
    if (hi > 0) {
      // Binary search
      let lo = 0;
      let high = hi;

      while (lo < high) {
        const mid = (lo + high) >>> 1;
        if (this.rules[mid].baseValue === number) {
          return this.rules[mid];
        } else if (this.rules[mid].baseValue > number) {
          high = mid;
        } else {
          lo = mid + 1;
        }
      }

      if (high === 0) {
        return null; // bad rule set, minimum base > number
      }

      let result = this.rules[high - 1];

      // Check rollback
      if (result.shouldRollBack(number)) {
        if (high === 1) {
          return null;
        }
        result = this.rules[high - 2];
      }
      return result;
    }

    // No normal rules — fall back to default rule
    return this.nonNumericalRules[DEFAULT_RULE_INDEX];
  }

  /**
   * Find the best rule in a fraction rule set.
   *
   * Each rule's baseValue is treated as a denominator. We find the
   * denominator that produces the fraction closest to the input number
   * using LCM-based integer arithmetic to avoid rounding errors.
   */
  private findFractionRuleSetRule(number: number): NFRule | null {
    if (this.rules.length === 0) return null;

    // Compute LCM of all base values
    let leastCommonMultiple = this.rules[0].baseValue;
    if (leastCommonMultiple === 0) return null;

    for (let i = 1; i < this.rules.length; i++) {
      leastCommonMultiple = lcm(leastCommonMultiple, this.rules[i].baseValue);
    }

    const numerator = Math.round(number * leastCommonMultiple);

    // Find the rule whose denominator produces the closest fraction
    let difference = Number.MAX_SAFE_INTEGER;
    let winner = 0;

    for (let i = 0; i < this.rules.length; i++) {
      let tempDifference = (numerator * this.rules[i].baseValue) % leastCommonMultiple;

      // Normalize: distance from closest multiple of LCM
      if (leastCommonMultiple - tempDifference < tempDifference) {
        tempDifference = leastCommonMultiple - tempDifference;
      }

      if (tempDifference < difference) {
        difference = tempDifference;
        winner = i;
        if (difference === 0) break;
      }
    }

    // Two successive rules with same base value:
    // first is used when numerator is 1, second otherwise
    if (
      winner + 1 < this.rules.length &&
      this.rules[winner + 1].baseValue === this.rules[winner].baseValue
    ) {
      const n = this.rules[winner].baseValue * number;
      if (n < 0.5 || n >= 2) {
        winner++;
      }
    }

    return this.rules[winner];
  }

  // ==================================================================
  // Parsing
  // ==================================================================

  /**
   * Parse text by trying each rule and returning the longest match.
   *
   * Non-numerical rules are tried first (with bitmask tracking to prevent
   * re-execution), then regular rules in reverse order (most significant
   * first).
   */
  parse(
    text: string,
    parsePosition: ParsePosition,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number {
    if (recursionCount >= RECURSION_LIMIT) {
      return 0;
    }

    if (text.length === 0) {
      return 0;
    }

    const highWaterMark: ParsePosition = { index: 0, errorIndex: -1 };
    let result = 0;

    // Try non-numerical rules
    for (let i = 0; i < NON_NUMERICAL_RULE_LENGTH; i++) {
      if (this.nonNumericalRules[i] && ((nonNumericalExecutedRuleMask >> i) & 1) === 0) {
        // Mark this rule as executed
        const mask = nonNumericalExecutedRuleMask | (1 << i);

        const workingPos: ParsePosition = { index: 0, errorIndex: -1 };
        const tempResult = this.nonNumericalRules[i]!.doParse(
          text,
          workingPos,
          false,
          upperBound,
          mask,
          recursionCount + 1,
        );

        if (workingPos.index > highWaterMark.index) {
          result = tempResult;
          highWaterMark.index = workingPos.index;
          highWaterMark.errorIndex = workingPos.errorIndex;
        }
      }
    }

    // Try regular rules in reverse order (most significant first)
    const ub = Math.round(upperBound);
    for (let i = this.rules.length - 1; i >= 0 && highWaterMark.index < text.length; i--) {
      if (!this.fIsFractionRuleSet && this.rules[i].baseValue >= ub) {
        continue;
      }

      const workingPos: ParsePosition = { index: 0, errorIndex: -1 };
      const tempResult = this.rules[i].doParse(
        text,
        workingPos,
        this.fIsFractionRuleSet,
        upperBound,
        nonNumericalExecutedRuleMask,
        recursionCount + 1,
      );

      if (workingPos.index > highWaterMark.index) {
        result = tempResult;
        highWaterMark.index = workingPos.index;
        highWaterMark.errorIndex = workingPos.errorIndex;
      }
    }

    parsePosition.index = highWaterMark.index;
    if (highWaterMark.index > 0) {
      parsePosition.errorIndex = 0;
    }

    return result;
  }

  // ==================================================================
  // Serialization
  // ==================================================================

  /** Serialize all rules back to text (name:\nrule1;\nrule2;\n...). */
  appendRules(): string {
    let result = this.name + ":\n";

    // Regular rules
    for (const rule of this.rules) {
      result += rule.toRuleString() + "\n";
    }

    // Special rules
    for (let i = 0; i < NON_NUMERICAL_RULE_LENGTH; i++) {
      const rule = this.nonNumericalRules[i];
      if (rule) {
        result += rule.toRuleString() + "\n";
      }
    }

    return result;
  }

  // ==================================================================
  // Accessors
  // ==================================================================

  getName(): string {
    return this.name;
  }

  isPublic(): boolean {
    return this.fIsPublic;
  }

  isParseable(): boolean {
    return this.fIsParseable;
  }

  isFractionRuleSet(): boolean {
    return this.fIsFractionRuleSet;
  }

  /** Get the number of normal rules. */
  getRuleCount(): number {
    return this.rules.length;
  }

  // ==================================================================
  // Equality
  // ==================================================================

  equals(other: NFRuleSet): boolean {
    if (this.rules.length !== other.rules.length) return false;
    if (this.fIsFractionRuleSet !== other.fIsFractionRuleSet) return false;
    if (this.name !== other.name) return false;

    for (let i = 0; i < NON_NUMERICAL_RULE_LENGTH; i++) {
      const a = this.nonNumericalRules[i];
      const b = other.nonNumericalRules[i];
      if (a === null && b === null) continue;
      if (a === null || b === null) return false;
      if (!a.equals(b)) return false;
    }

    for (let i = 0; i < this.rules.length; i++) {
      if (!this.rules[i].equals(other.rules[i])) return false;
    }

    return true;
  }
}
