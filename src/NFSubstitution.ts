import type { INFRuleSet, INumberFormat, ParsePosition } from "./types.js";

/**
 * Abstract base class for RBNF substitutions.
 *
 * A substitution performs a mathematical operation on the number being
 * formatted (transformNumber), formats the result using either a rule set
 * or a number format pattern, and inserts the result into the output string
 * at a recorded position.
 *
 * Parsing is the inverse: parse text via the rule set or number format,
 * then compose the parsed value with the rule's base value
 * (composeRuleValue).
 */
export abstract class NFSubstitution {
  /** Position in the owning rule's ruleText where this substitution sits. */
  private readonly _pos: number;

  /** Rule set used to format/parse the substitution result, or null. */
  protected ruleSet: INFRuleSet | null;

  /** DecimalFormat-style formatter, used when the token contains a pattern. */
  protected numberFormat: INumberFormat | null;

  /**
   * @param pos          Position in the owning rule's ruleText.
   * @param ruleSet      The owning rule set (used when description is bare
   *                     or starts with '>').
   * @param description  The full substitution token, e.g. "<<", "=%spellout-cardinal=",
   *                     "=#,##0=". Delimiters are stripped here; the inner
   *                     content decides whether we use a rule set or number format.
   * @param resolveRuleSet   Callback to look up a named rule set (e.g. "%spellout-cardinal").
   * @param createNumberFormat  Callback to create a number format from a pattern (e.g. "#,##0").
   */
  constructor(
    pos: number,
    ruleSet: INFRuleSet,
    description: string,
    resolveRuleSet: (name: string) => INFRuleSet,
    createNumberFormat: (pattern: string) => INumberFormat,
  ) {
    this._pos = pos;
    this.ruleSet = null;
    this.numberFormat = null;

    // Strip matched delimiters: "<<" → "", "=%foo=" → "%foo"
    let inner = description;
    if (inner.length >= 2 && inner[0] === inner[inner.length - 1]) {
      inner = inner.substring(1, inner.length - 1);
    } else if (inner.length !== 0) {
      throw new Error("Illegal substitution syntax");
    }

    if (inner.length === 0) {
      // Bare token ("<<", ">>") — use owning rule set
      this.ruleSet = ruleSet;
    } else if (inner[0] === "%") {
      // Named rule set reference ("<%spellout-cardinal<")
      this.ruleSet = resolveRuleSet(inner);
    } else if (inner[0] === "#" || inner[0] === "0") {
      // DecimalFormat pattern ("=#,##0=")
      this.numberFormat = createNumberFormat(inner);
    } else if (inner[0] === ">") {
      // ">>>" — use owning rule set (short-circuit handled by ModulusSubstitution)
      this.ruleSet = ruleSet;
    } else {
      throw new Error("Illegal substitution syntax");
    }
  }

  // ==================================================================
  // Abstract — subclass-specific math
  // ==================================================================

  /** Transform the number before formatting (e.g., divide, modulo, abs). */
  protected abstract transformNumber(number: number): number;

  /** Inverse of transformNumber — compose a parse result with baseValue. */
  abstract composeRuleValue(newRuleValue: number, oldRuleValue: number): number;

  /** Upper bound for rule search during parsing. */
  abstract calcUpperBound(oldUpperBound: number): number;

  /** Token character for serialization: '<', '>', or '='. */
  abstract tokenChar(): string;

  // ==================================================================
  // Concrete — shared logic
  // ==================================================================

  getPos(): number {
    return this._pos;
  }

  /** No-op by default; overridden by Multiplier/Modulus substitutions. */
  setDivisor(_radix: number, _exponent: number): void {}

  /** False by default; overridden by ModulusSubstitution. */
  isModulusSubstitution(): boolean {
    return false;
  }

  /**
   * Format: transform the number, format via ruleSet or numberFormat,
   * and insert the result into output[0] at (pos + this._pos).
   *
   * output is a single-element string array (mutable wrapper for JS
   * immutable strings). Caller reads output[0] after the call.
   */
  doSubstitution(number: number, output: string[], pos: number, recursionCount: number): void {
    const transformed = this.transformNumber(number);

    if (this.ruleSet !== null) {
      this.ruleSet.format(transformed, output, pos + this._pos, recursionCount);
    } else if (this.numberFormat !== null) {
      const temp = this.numberFormat.format(transformed);
      const insertAt = pos + this._pos;
      output[0] = output[0].substring(0, insertAt) + temp + output[0].substring(insertAt);
    }
  }

  /**
   * Parse: use ruleSet or numberFormat to parse text, then compose the
   * result with baseValue via composeRuleValue().
   *
   * Returns the composed value. Advances parsePosition.index on success,
   * leaves it at 0 on failure.
   */
  doParse(
    text: string,
    parsePosition: ParsePosition,
    baseValue: number,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number {
    upperBound = this.calcUpperBound(upperBound);

    let tempResult = 0;

    if (this.ruleSet !== null) {
      tempResult = this.ruleSet.parse(
        text,
        parsePosition,
        upperBound,
        nonNumericalExecutedRuleMask,
        recursionCount,
      );
    } else if (this.numberFormat !== null) {
      tempResult = this.numberFormat.parse(text, parsePosition);
    }

    if (parsePosition.index !== 0) {
      return this.composeRuleValue(tempResult, baseValue);
    }
    return 0;
  }

  /** Serialize back to token string, e.g. "<<", "=%spellout-cardinal=", "=#,##0=". */
  toString(): string {
    const tc = this.tokenChar();
    // Reconstruct the inner content from whichever reference we hold
    // (In a full implementation, ruleSet would expose its name and
    // numberFormat its pattern. For now, return the bare token.)
    return `${tc}${tc}`;
  }
}
