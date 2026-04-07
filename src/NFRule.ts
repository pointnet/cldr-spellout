import { makeSubstitution } from "./util/makeSubstitution.js";
import type { NFSubstitution } from "./NFSubstitution.js";
import { RuleType } from "./types.js";
import type {
  IFormatter,
  INFRule,
  INFRuleSet,
  IPluralFormat,
  ParsePosition,
  PluralType,
} from "./types.js";
import { expectedExponent as expectedExponent } from "./util/expectedExponent.js";
import { pow } from "./util/pow.js";

/** Max recursion depth to prevent stack overflow in recursive rules. */
const MAX_RECURSION = 64;

/**
 * Substitution token prefixes, searched in order of priority.
 * Mirrors the C++ RULE_PREFIXES array.
 */
const RULE_PREFIXES = ["<<", "<%", "<#", "<0", ">>", ">%", ">#", ">0", "=%", "=#", "=0"];

/**
 * A single rule in a RuleBasedNumberFormat rule set.
 *
 * Each rule has a base value (or special-type sentinel), up to two
 * substitutions, and rule body text. It knows how to format a number
 * by inserting text and delegating to its substitutions, and how to
 * parse text back into a number.
 */
export class NFRule implements INFRule {
  private _baseValue: number = 0;
  private _radix: number = 10;
  private _exponent: number = 0;
  private _decimalPoint: string = "";
  private _ruleText: string = "";
  private _sub1: NFSubstitution | null = null;
  private _sub2: NFSubstitution | null = null;
  private _rulePatternFormat: IPluralFormat | null = null;
  private readonly _formatter: IFormatter;

  // ==================================================================
  // Constructor
  // ==================================================================

  constructor(formatter: IFormatter, ruleText?: string) {
    this._formatter = formatter;
    if (ruleText !== undefined && ruleText.length > 0) {
      this._ruleText = ruleText;
      this.parseRuleDescriptor();
    }
  }

  // ==================================================================
  // Static factory: makeRules
  // ==================================================================

  /**
   * Parse a rule description string into one or two NFRule instances.
   *
   * Bracket notation `[text]` creates two rules:
   *   - rule1 (baseValue+1): includes bracket content
   *   - rule2 (baseValue):   omits bracket content
   *
   * Pipe notation `[before|after]`:
   *   - rule1 gets "before" in place of brackets
   *   - rule2 gets "after" in place of brackets
   *
   * Special rules (negative baseValue) go to `ruleSet.setNonNumericalRule()`
   * and are NOT returned in the array.
   */
  static makeRules(
    description: string,
    ruleSet: INFRuleSet,
    predecessor: NFRule | null,
    formatter: IFormatter,
  ): NFRule[] {
    const rule1 = new NFRule(formatter, description);
    description = rule1._ruleText;

    const brack1 = description.indexOf("[");
    const brack2 = brack1 >= 0 ? description.indexOf("]", brack1) : -1;

    const results: NFRule[] = [];
    const type = rule1.getType();

    const noBracketSplit =
      type === RuleType.ProperFraction ||
      type === RuleType.NegativeNumber ||
      type === RuleType.Infinity ||
      type === RuleType.NaN;

    if (brack2 < 0 || brack1 > brack2 || noBracketSplit) {
      rule1.extractSubstitutions(ruleSet, description, predecessor);
      NFRule.addToResults(rule1, ruleSet, results);
      return results;
    }

    // Bracket expansion — potentially two rules
    const orElseOp = description.indexOf("|", brack1);
    const hasOrElse = orElseOp >= 0 && orElseOp < brack2;

    const mod = pow(rule1._radix, rule1._exponent);
    if (rule1._baseValue > 0 && rule1._radix !== 0 && mod === 0) {
      throw new Error("Rule base value out of bounds");
    }

    const shouldSplit =
      (rule1._baseValue > 0 && rule1._radix !== 0 && rule1._baseValue % mod === 0) ||
      type === RuleType.ImproperFraction ||
      type === RuleType.Default;

    let rule2: NFRule | null = null;

    if (shouldSplit) {
      rule2 = new NFRule(formatter);

      if (rule1._baseValue >= 0) {
        rule2._baseValue = rule1._baseValue;
        if (!ruleSet.isFractionRuleSet()) {
          rule1._baseValue += 1;
        }
      } else if (type === RuleType.ImproperFraction) {
        rule2._baseValue = RuleType.ProperFraction;
      } else if (type === RuleType.Default) {
        rule2._baseValue = rule1._baseValue;
        rule1._baseValue = RuleType.ImproperFraction;
      }

      rule2._radix = rule1._radix;
      rule2._exponent = rule1._exponent;

      // rule2 text: everything OUTSIDE brackets (or "after" if pipe)
      let rule2Text = description.substring(0, brack1);
      if (hasOrElse) {
        rule2Text += description.substring(orElseOp + 1, brack2);
      }
      if (brack2 + 1 < description.length) {
        rule2Text += description.substring(brack2 + 1);
      }
      rule2.extractSubstitutions(ruleSet, rule2Text, predecessor);
    }

    // rule1 text: bracket content included, brackets removed
    let rule1Text = description.substring(0, brack1);
    if (hasOrElse) {
      rule1Text += description.substring(brack1 + 1, orElseOp);
    } else {
      rule1Text += description.substring(brack1 + 1, brack2);
    }
    if (brack2 + 1 < description.length) {
      rule1Text += description.substring(brack2 + 1);
    }
    rule1.extractSubstitutions(ruleSet, rule1Text, predecessor);

    // rule2 goes BEFORE rule1 in the list
    if (rule2) {
      NFRule.addToResults(rule2, ruleSet, results);
    }
    NFRule.addToResults(rule1, ruleSet, results);

    return results;
  }

  private static addToResults(rule: NFRule, ruleSet: INFRuleSet, results: NFRule[]): void {
    if (rule._baseValue >= RuleType.NoBase) {
      results.push(rule);
    } else {
      ruleSet.setNonNumericalRule(rule);
    }
  }

  // ==================================================================
  // Descriptor parsing
  // ==================================================================

  private parseRuleDescriptor(): void {
    const p = this._ruleText.indexOf(":");
    if (p === -1) return;

    const descriptor = this._ruleText.substring(0, p);

    // Skip colon + trailing whitespace
    let i = p + 1;
    while (i < this._ruleText.length && /\s/.test(this._ruleText[i])) {
      i++;
    }
    this._ruleText = this._ruleText.substring(i);

    const len = descriptor.length;
    const first = descriptor[0];
    const last = descriptor[len - 1];

    if (first >= "0" && first <= "9" && last !== "x") {
      this.parseNumericDescriptor(descriptor);
    } else if (descriptor === "-x") {
      this._baseValue = RuleType.NegativeNumber;
    } else if (len === 3) {
      if (first === "0" && last === "x") {
        this._baseValue = RuleType.ProperFraction;
        this._decimalPoint = descriptor[1];
      } else if (first === "x" && last === "x") {
        this._baseValue = RuleType.ImproperFraction;
        this._decimalPoint = descriptor[1];
      } else if (first === "x" && last === "0") {
        this._baseValue = RuleType.Default;
        this._decimalPoint = descriptor[1];
      } else if (descriptor === "NaN") {
        this._baseValue = RuleType.NaN;
      } else if (descriptor === "Inf") {
        this._baseValue = RuleType.Infinity;
      }
    }

    // Strip leading apostrophe (used to preserve leading whitespace)
    if (this._ruleText.length > 0 && this._ruleText[0] === "'") {
      this._ruleText = this._ruleText.substring(1);
    }
  }

  private parseNumericDescriptor(descriptor: string): void {
    let p = 0;
    let val = 0;
    let c = "";

    while (p < descriptor.length) {
      c = descriptor[p];
      if (c >= "0" && c <= "9") {
        val = val * 10 + (c.charCodeAt(0) - 0x30);
      } else if (c === "/" || c === ">") {
        break;
      } else if (c === "," || c === "." || c === " ") {
        // skip formatting punctuation
      } else {
        throw new Error(`Illegal character '${c}' in rule descriptor`);
      }
      p++;
    }
    this.setBaseValue(val);

    // Optional /radix
    if (c === "/") {
      val = 0;
      p++;
      while (p < descriptor.length) {
        c = descriptor[p];
        if (c >= "0" && c <= "9") {
          val = val * 10 + (c.charCodeAt(0) - 0x30);
        } else if (c === ">") {
          break;
        } else if (c === "," || c === "." || c === " ") {
          // skip
        } else {
          throw new Error(`Illegal character '${c}' in rule descriptor`);
        }
        p++;
      }
      if (val === 0) throw new Error("Rule can't have radix of 0");
      this._radix = val;
      this._exponent = expectedExponent(this._baseValue, this._radix);
    }

    // Optional > signs (each decrements exponent)
    if (c === ">") {
      while (p < descriptor.length) {
        c = descriptor[p];
        if (c === ">" && this._exponent > 0) {
          this._exponent--;
        } else {
          throw new Error(`Illegal character '${c}' in rule descriptor`);
        }
        p++;
      }
    }
  }

  // ==================================================================
  // Substitution extraction
  // ==================================================================

  private extractSubstitutions(
    ruleSet: INFRuleSet,
    ruleText: string,
    predecessor: NFRule | null,
  ): void {
    this._ruleText = ruleText;
    this._sub1 = this.extractOneSubstitution(ruleSet, predecessor);
    this._sub2 = this._sub1 !== null ? this.extractOneSubstitution(ruleSet, predecessor) : null;

    // Detect plural pattern: $(cardinal, {0} items)$
    const pluralStart = this._ruleText.indexOf("$(");
    const pluralEnd = pluralStart >= 0 ? this._ruleText.indexOf(")$", pluralStart) : -1;
    if (pluralEnd >= 0) {
      const endType = this._ruleText.indexOf(",", pluralStart);
      if (endType < 0) {
        throw new Error("Invalid plural pattern: missing comma");
      }
      const typeStr = this._ruleText.substring(pluralStart + 2, endType).trim();
      const pattern = this._ruleText.substring(endType + 1, pluralEnd).trim();
      let pluralType: PluralType;
      if (typeStr.startsWith("cardinal")) {
        pluralType = "cardinal";
      } else if (typeStr.startsWith("ordinal")) {
        pluralType = "ordinal";
      } else {
        throw new Error(`Unknown plural type: ${typeStr}`);
      }
      this._rulePatternFormat = this._formatter.createPluralFormat(pluralType, pattern);
    }
  }

  private extractOneSubstitution(
    ruleSet: INFRuleSet,
    predecessor: NFRule | null,
  ): NFSubstitution | null {
    const subStart = this.indexOfAnyRulePrefix();
    if (subStart === -1) return null;

    let subEnd: number;

    // Special-case ">>>" — searching for ">" end would find the middle
    if (this._ruleText.indexOf(">>>") === subStart) {
      subEnd = subStart + 2;
    } else {
      const c = this._ruleText[subStart];
      subEnd = this._ruleText.indexOf(c, subStart + 1);
    }

    if (subEnd === -1) return null;

    const token = this._ruleText.substring(subStart, subEnd + 1);
    const result = makeSubstitution(subStart, this, predecessor, ruleSet, this._formatter, token);

    // Remove the token from ruleText
    this._ruleText = this._ruleText.substring(0, subStart) + this._ruleText.substring(subEnd + 1);

    return result;
  }

  /**
   * Search ruleText for the first occurrence of any substitution prefix.
   * Returns the index of the earliest match, or -1.
   */
  private indexOfAnyRulePrefix(): number {
    let result = -1;
    for (const prefix of RULE_PREFIXES) {
      const pos = this._ruleText.indexOf(prefix);
      if (pos !== -1 && (result === -1 || pos < result)) {
        result = pos;
      }
    }
    return result;
  }

  // ==================================================================
  // Base value management
  // ==================================================================

  setBaseValue(value: number): void {
    this._baseValue = value;
    this._radix = 10;
    if (value >= 1) {
      this._exponent = expectedExponent(value, this._radix);
      this._sub1?.setDivisor(this._radix, this._exponent);
      this._sub2?.setDivisor(this._radix, this._exponent);
    } else {
      this._exponent = 0;
    }
  }

  setType(ruleType: RuleType): void {
    this._baseValue = ruleType;
  }

  // ==================================================================
  // Formatting
  // ==================================================================

  doFormat(number: number, output: string[], pos: number, recursionCount: number): void {
    if (recursionCount >= MAX_RECURSION) {
      throw new Error("Recursion limit exceeded in RBNF formatting");
    }

    let pluralRuleStart = this._ruleText.length;
    let lengthOffset = 0;

    if (!this._rulePatternFormat) {
      output[0] = output[0].substring(0, pos) + this._ruleText + output[0].substring(pos);
    } else {
      pluralRuleStart = this._ruleText.indexOf("$(");
      const pluralRuleEnd = this._ruleText.indexOf(")$", pluralRuleStart);
      const initialLength = output[0].length;

      // Insert suffix (text after plural pattern)
      if (pluralRuleEnd + 2 < this._ruleText.length) {
        output[0] =
          output[0].substring(0, pos) +
          this._ruleText.substring(pluralRuleEnd + 2) +
          output[0].substring(pos);
      }

      // Insert formatted plural value
      const divisor = pow(this._radix, this._exponent);
      let pluralVal: number;
      if (0 <= number && number < 1) {
        // Fractional rule: match NumeratorSubstitution behavior
        pluralVal = Math.round(number * divisor);
      } else {
        pluralVal = Math.floor(number / divisor);
      }
      const pluralText = this._rulePatternFormat.format(pluralVal);
      output[0] = output[0].substring(0, pos) + pluralText + output[0].substring(pos);

      // Insert prefix (text before plural pattern)
      if (pluralRuleStart > 0) {
        output[0] =
          output[0].substring(0, pos) +
          this._ruleText.substring(0, pluralRuleStart) +
          output[0].substring(pos);
      }

      lengthOffset = this._ruleText.length - (output[0].length - initialLength);
    }

    // Apply substitutions in reverse order to preserve position offsets
    if (this._sub2) {
      this._sub2.doSubstitution(
        number,
        output,
        pos - (this._sub2.getPos() > pluralRuleStart ? lengthOffset : 0),
        recursionCount + 1,
      );
    }
    if (this._sub1) {
      this._sub1.doSubstitution(
        number,
        output,
        pos - (this._sub1.getPos() > pluralRuleStart ? lengthOffset : 0),
        recursionCount + 1,
      );
    }
  }

  // ==================================================================
  // Parsing
  // ==================================================================

  doParse(
    text: string,
    parsePosition: ParsePosition,
    isFractionRule: boolean,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number {
    if (recursionCount >= MAX_RECURSION) {
      return 0;
    }

    const pp: ParsePosition = { index: 0, errorIndex: -1 };
    let workText = text;

    const sub1Pos = this._sub1 !== null ? this._sub1.getPos() : this._ruleText.length;
    const sub2Pos = this._sub2 !== null ? this._sub2.getPos() : this._ruleText.length;

    // Strip prefix (rule text before first substitution)
    const prefix = this._ruleText.substring(0, sub1Pos);
    this.stripPrefix(workText, prefix, pp);
    workText = workText.substring(pp.index);
    const prefixLength = text.length - workText.length;

    if (pp.index === 0 && sub1Pos !== 0) {
      parsePosition.errorIndex = pp.errorIndex;
      return 0;
    }

    // Special values
    if (this._baseValue === RuleType.Infinity) {
      parsePosition.index = pp.index;
      return Infinity;
    }
    if (this._baseValue === RuleType.NaN) {
      parsePosition.index = pp.index;
      return NaN;
    }

    // Main matching loop
    let highWaterMark = 0;
    let result = 0;
    let start = 0;
    const tempBaseValue = this._baseValue <= 0 ? 0 : this._baseValue;

    do {
      pp.index = 0;
      pp.errorIndex = -1;

      const delimiter1 = this._ruleText.substring(sub1Pos, sub2Pos);
      const partialResult = this.matchToDelimiter(
        workText,
        start,
        tempBaseValue,
        delimiter1,
        pp,
        this._sub1,
        nonNumericalExecutedRuleMask,
        recursionCount,
        upperBound,
      );

      if (pp.index !== 0 || this._sub1 === null) {
        start = pp.index;

        const workText2 = workText.substring(pp.index);
        const pp2: ParsePosition = { index: 0, errorIndex: -1 };

        const delimiter2 = this._ruleText.substring(sub2Pos);
        const finalResult = this.matchToDelimiter(
          workText2,
          0,
          partialResult,
          delimiter2,
          pp2,
          this._sub2,
          nonNumericalExecutedRuleMask,
          recursionCount,
          upperBound,
        );

        if (pp2.index !== 0 || this._sub2 === null) {
          if (prefixLength + pp.index + pp2.index > highWaterMark) {
            highWaterMark = prefixLength + pp.index + pp2.index;
            result = finalResult;
          }
        } else {
          const errIdx = pp2.errorIndex + sub1Pos + pp.index;
          if (errIdx > parsePosition.errorIndex) {
            parsePosition.errorIndex = errIdx;
          }
        }
      } else {
        const errIdx = sub1Pos + pp.errorIndex;
        if (errIdx > parsePosition.errorIndex) {
          parsePosition.errorIndex = errIdx;
        }
      }
    } while (
      sub1Pos !== sub2Pos &&
      pp.index > 0 &&
      pp.index < workText.length &&
      pp.index !== start
    );

    parsePosition.index = highWaterMark;
    if (highWaterMark > 0) {
      parsePosition.errorIndex = 0;
    }

    // Fraction rule set special case: no substitutions → numerator is 1
    if (isFractionRule && highWaterMark > 0 && this._sub1 === null) {
      result = 1 / result;
    }

    return result;
  }

  // ==================================================================
  // Parsing helpers
  // ==================================================================

  private matchToDelimiter(
    text: string,
    startPos: number,
    baseVal: number,
    delimiter: string,
    pp: ParsePosition,
    sub: NFSubstitution | null,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
    upperBound: number,
  ): number {
    // If delimiter has real (non-empty) text, search for it
    if (delimiter.length > 0 && delimiter.trim().length > 0) {
      let currPos = startPos;
      let bestResult = 0;
      let bestResultSet = false;

      for (;;) {
        const dPos = this.findText(text, delimiter, currPos);
        if (dPos < 0) break;

        const dLen = delimiter.length;
        const subText = text.substring(0, dPos);

        if (subText.length > 0 && sub !== null) {
          const tempPP: ParsePosition = { index: 0, errorIndex: -1 };
          const tempResult = sub.doParse(
            subText,
            tempPP,
            baseVal,
            upperBound,
            nonNumericalExecutedRuleMask,
            recursionCount + 1,
          );

          if (tempPP.index === dPos) {
            pp.index = dPos + dLen;
            bestResult = tempResult;
            bestResultSet = true;
          } else {
            if (bestResultSet) return bestResult;
            pp.errorIndex = tempPP.errorIndex > 0 ? tempPP.errorIndex : tempPP.index;
          }
        }

        currPos = dPos + dLen;
      }

      if (bestResultSet) return bestResult;
      pp.index = 0;
      return 0;
    }

    // Delimiter is empty or all whitespace
    if (sub === null) {
      return baseVal;
    }

    const tempPP: ParsePosition = { index: 0, errorIndex: -1 };
    const tempResult = sub.doParse(
      text.substring(startPos),
      tempPP,
      baseVal,
      upperBound,
      nonNumericalExecutedRuleMask,
      recursionCount + 1,
    );

    if (tempPP.index !== 0) {
      pp.index = startPos + tempPP.index;
      return tempResult;
    }

    pp.errorIndex = tempPP.errorIndex;
    return 0;
  }

  private stripPrefix(text: string, prefix: string, pp: ParsePosition): void {
    if (prefix.length === 0) return;
    const pfl = this.prefixLength(text, prefix);
    if (pfl !== 0) {
      pp.index += pfl;
    }
  }

  /**
   * Case-insensitive prefix matching. Returns the number of characters
   * matched, or 0 if no match. Lenient/collation parsing is omitted.
   */
  private prefixLength(text: string, prefix: string): number {
    if (prefix.length === 0) return 0;
    if (
      text.length >= prefix.length &&
      text.substring(0, prefix.length).toLowerCase() === prefix.toLowerCase()
    ) {
      return prefix.length;
    }
    return 0;
  }

  /**
   * Search for `key` in `str` starting at `startingAt`.
   * Returns the index of the match, or -1. Case-insensitive.
   */
  private findText(str: string, key: string, startingAt: number): number {
    if (key.length === 0) return startingAt;
    const lowerStr = str.toLowerCase();
    const lowerKey = key.toLowerCase();
    return lowerStr.indexOf(lowerKey, startingAt);
  }

  // ==================================================================
  // Rollback logic
  // ==================================================================

  shouldRollBack(number: number): boolean {
    if (this._radix === 0) return false;
    if (!this.hasModulusSubstitution()) return false;
    const divisor = pow(this._radix, this._exponent);
    return number % divisor === 0 && this._baseValue % divisor !== 0;
  }

  // ==================================================================
  // Accessors
  // ==================================================================

  get baseValue(): number {
    return this._baseValue;
  }
  get radix(): number {
    return this._radix;
  }
  get exponent(): number {
    return this._exponent;
  }
  get decimalPoint(): string {
    return this._decimalPoint;
  }
  get ruleText(): string {
    return this._ruleText;
  }
  get sub1(): NFSubstitution | null {
    return this._sub1;
  }
  get sub2(): NFSubstitution | null {
    return this._sub2;
  }
  get formatter(): IFormatter {
    return this._formatter;
  }

  getType(): RuleType {
    return this._baseValue <= RuleType.NoBase ? (this._baseValue as RuleType) : RuleType.NoBase;
  }

  getDivisor(): number {
    return pow(this._radix, this._exponent);
  }

  hasModulusSubstitution(): boolean {
    return (
      (this._sub1?.isModulusSubstitution() ?? false) ||
      (this._sub2?.isModulusSubstitution() ?? false)
    );
  }

  // ==================================================================
  // Serialization
  // ==================================================================

  toRuleString(): string {
    let result = "";

    switch (this.getType()) {
      case RuleType.NegativeNumber:
        result += "-x";
        break;
      case RuleType.ImproperFraction:
        result += `x${this._decimalPoint || "."}x`;
        break;
      case RuleType.ProperFraction:
        result += `0${this._decimalPoint || "."}x`;
        break;
      case RuleType.Default:
        result += `x${this._decimalPoint || "."}0`;
        break;
      case RuleType.Infinity:
        result += "Inf";
        break;
      case RuleType.NaN:
        result += "NaN";
        break;
      default: {
        result += String(this._baseValue);
        if (this._radix !== 10) result += `/${this._radix}`;
        const numCarets = expectedExponent(this._baseValue, this._radix) - this._exponent;
        for (let i = 0; i < numCarets; i++) result += ">";
      }
    }
    result += ": ";

    // Preserve leading whitespace with apostrophe
    if (
      this._ruleText.length > 0 &&
      this._ruleText[0] === " " &&
      (this._sub1 === null || this._sub1.getPos() !== 0)
    ) {
      result += "'";
    }

    // Re-insert substitution tokens at their original positions
    let text = this._ruleText;
    if (this._sub2) {
      const token = this._sub2.toString();
      text = text.substring(0, this._sub2.getPos()) + token + text.substring(this._sub2.getPos());
    }
    if (this._sub1) {
      const token = this._sub1.toString();
      text = text.substring(0, this._sub1.getPos()) + token + text.substring(this._sub1.getPos());
    }

    result += text + ";";
    return result;
  }

  // ==================================================================
  // Equality
  // ==================================================================

  equals(other: NFRule): boolean {
    return (
      this._baseValue === other._baseValue &&
      this._radix === other._radix &&
      this._exponent === other._exponent &&
      this._ruleText === other._ruleText
    );
  }
}
