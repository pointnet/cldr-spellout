/**
 * Special rule type sentinels, stored in NFRule.baseValue.
 * Normal rules have a non-negative baseValue; special rules use these.
 * @internal
 */
export enum RuleType {
  NoBase = 0,
  NegativeNumber = -1,
  ImproperFraction = -2,
  ProperFraction = -3,
  Default = -4,
  Infinity = -5,
  NaN = -6,
}

/** @internal */
export type PluralType = "cardinal" | "ordinal";

/** @internal */
export interface IPluralFormat {
  format(number: number): string;
}

/** @internal */
export interface ParsePosition {
  index: number;
  errorIndex: number;
}

/**
 * Abstraction over DecimalFormat — formats/parses numbers using a pattern
 * like "#,##0" or "0.###".
 * @internal
 */
export interface INumberFormat {
  format(number: number): string;
  parse(text: string, pos: ParsePosition): number;
}

/**
 * Minimal NFRule interface consumed by NFSubstitution.
 * Breaks the circular dependency: NFSubstitution needs NFRule,
 * NFRule needs NFSubstitution.
 * @internal
 */
export interface INFRule {
  /** Rule's base value, or a negative RuleType sentinel. */
  readonly baseValue: number;

  /** radix^exponent — the divisor used by Multiplier/Modulus substitutions. */
  getDivisor(): number;

  /** True if either substitution is a ModulusSubstitution. */
  hasModulusSubstitution(): boolean;

  /** Format number into output[0] at pos. Used by >>> (ModulusSubstitution). */
  doFormat(number: number, output: string[], pos: number, recursionCount: number): void;

  /** Parse text back to a number. Used by >>> (ModulusSubstitution). */
  doParse(
    text: string,
    parsePosition: ParsePosition,
    isFractionRule: boolean,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number;
}

/**
 * Minimal NFRuleSet interface consumed by NFSubstitution and NFRule.
 * @internal
 */
export interface INFRuleSet {
  /** Format number, inserting result into output[0] at pos. */
  format(number: number, output: string[], pos: number, recursionCount: number): void;

  /** Parse text, returning the parsed value. Advances parsePosition.index on success. */
  parse(
    text: string,
    parsePosition: ParsePosition,
    upperBound: number,
    nonNumericalExecutedRuleMask: number,
    recursionCount: number,
  ): number;

  /** True if this is a fraction rule set (e.g., %%frac). */
  isFractionRuleSet(): boolean;

  /** Mark this rule set as a fraction rule set (called by FractionalPartSubstitution). */
  makeIntoFractionRuleSet(): void;

  /** Register a special rule (negative baseValue) on this rule set. */
  setNonNumericalRule(rule: INFRule): void;
}

/**
 * What NFRule needs from the top-level RuleBasedNumberFormat.
 * Breaks the circular dependency: NFRule -> RuleBasedNumberFormat -> NFRule.
 * @internal
 */
export interface IFormatter {
  /** Look up a named rule set (e.g., "%spellout-cardinal"). */
  resolveRuleSet(name: string): INFRuleSet;

  /** Create a DecimalFormat-style formatter from a pattern (e.g., "#,##0"). */
  createNumberFormat(pattern: string): INumberFormat;

  /** Create a plural format for $(cardinal, ...)$ or $(ordinal, ...)$ patterns. */
  createPluralFormat(type: PluralType, pattern: string): IPluralFormat;

  /** Default NaN rule (used when a rule set has no NaN rule of its own). */
  getDefaultNaNRule(): INFRule | null;

  /** Default Infinity rule (used when a rule set has no Infinity rule of its own). */
  getDefaultInfinityRule(): INFRule | null;
}

/** Shape of a cldr-rbnf JSON file (e.g., `import('cldr-rbnf/rbnf/en.json')`). */
export interface IRBNFData {
  rbnf: {
    identity: { language: string; territory?: string };
    rbnf: Record<string, Record<string, [string, string][] | string>>;
  };
}
