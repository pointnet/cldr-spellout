import { NFRule } from "./NFRule.js";
import { NFRuleSet } from "./NFRuleSet.js";
import { localeData } from "./localeData.js";
import { convertArrows } from "./util/convertArrows.js";
import { createNumberFormat } from "./util/numberFormat.js";
import { createPluralFormat } from "./util/pluralFormat.js";
import type {
  IFormatter,
  INFRule,
  INFRuleSet,
  INumberFormat,
  IPluralFormat,
  ParsePosition,
  PluralType,
  IRBNFData,
} from "./types.js";

// ==================================================================
// RuleBasedNumberFormat
// ==================================================================

/**
 * Top-level Rule-Based Number Format.
 *
 * Parses RBNF rule description strings into rule sets, and provides
 * format() and parse() methods. Implements IFormatter to satisfy
 * the callback interface that NFRule, NFRuleSet, and NFSubstitution
 * depend on.
 *
 * Mirrors ICU4C RuleBasedNumberFormat (rbnf.h / rbnf.cpp).
 */

export class RuleBasedNumberFormat implements IFormatter {
  private readonly locale: string;
  private readonly ruleSets: NFRuleSet[] = [];
  private defaultRuleSet!: NFRuleSet;
  private defaultInfinityRule: NFRule | null = null;
  private defaultNaNRule: NFRule | null = null;
  private readonly originalRules: string;

  /**
   * Construct a RuleBasedNumberFormat from a rule description string.
   *
   * @param rules  Semicolon-delimited rule descriptions, potentially
   *               containing multiple rule sets (delimited by `%name:`).
   * @param locale BCP 47 locale tag for Intl.NumberFormat / Intl.PluralRules
   *               (default: 'en').
   */
  constructor(rules: string, locale: string = "en") {
    this.locale = locale;
    this.originalRules = rules;
    this.init(rules);
  }

  /**
   * Create a RuleBasedNumberFormat for a locale by loading its
   * cldr-rbnf data automatically.
   *
   * @param locale BCP 47 locale tag (e.g., 'en', 'fr', 'de-CH').
   *               Must be one of the locales returned by getSupportedLocales().
   */
  static fromLocale(locale: string): RuleBasedNumberFormat {
    const data = localeData[locale];
    if (!data) {
      throw new Error(
        `Unsupported locale: ${locale}. Use RuleBasedNumberFormat.getSupportedLocales() for the full list.`,
      );
    }
    return RuleBasedNumberFormat.fromCldrData(data, locale);
  }

  /**
   * Create a RuleBasedNumberFormat from a cldr-rbnf JSON data object.
   *
   * @param data   The parsed JSON from a cldr-rbnf locale file.
   * @param locale Optional BCP 47 locale override. If omitted, derived
   *               from the JSON identity (language + optional territory).
   */
  static fromCldrData(data: IRBNFData, locale?: string): RuleBasedNumberFormat {
    const identity = data.rbnf.identity;
    if (!locale) {
      locale = identity.territory
        ? `${identity.language}-${identity.territory}`
        : identity.language;
    }

    const ruleGroups = data.rbnf.rbnf;
    const parts: string[] = [];

    for (const groupName of Object.keys(ruleGroups)) {
      const group = ruleGroups[groupName];

      for (const ruleSetName of Object.keys(group)) {
        // Skip metadata keys
        if (ruleSetName.startsWith("_")) continue;

        const rules = group[ruleSetName];
        if (!Array.isArray(rules)) continue;

        // Build rule set string: "%name:\ndescriptor: body\n..."
        let ruleSetStr = `${ruleSetName}:\n`;
        for (const [descriptor, body] of rules as [string, string][]) {
          ruleSetStr += `${descriptor}: ${body}\n`;
        }
        parts.push(ruleSetStr);
      }
    }

    const rulesString = convertArrows(parts.join(""));
    return new RuleBasedNumberFormat(rulesString, locale);
  }

  /**
   * Get the list of locales supported by cldr-rbnf.
   */
  static getSupportedLocales(): string[] {
    return Object.keys(localeData);
  }

  // ==================================================================
  // Initialization (port of C++ init())
  // ==================================================================

  private init(rules: string): void {
    // Strip whitespace after semicolons for boundary detection
    const description = this.stripWhitespace(rules);

    // Split into individual rule-set descriptions.
    // Rule sets are separated by ";%" — a semicolon followed by a percent.
    // The first rule set may or may not start with '%'.
    const descriptions = this.splitIntoRuleSetDescriptions(description);

    if (descriptions.length === 0) {
      throw new Error("No rule sets found in description");
    }

    // Phase 1: Create NFRuleSet objects (extracts names, but doesn't parse rules)
    for (let i = 0; i < descriptions.length; i++) {
      const ruleSet = new NFRuleSet(this, descriptions, i);
      this.ruleSets.push(ruleSet);
    }

    // Phase 2: Parse rules within each rule set
    for (let i = 0; i < this.ruleSets.length; i++) {
      this.ruleSets[i].parseRules(descriptions[i]);
    }

    // Select default rule set
    this.initDefaultRuleSet();
  }

  /**
   * Strip whitespace that follows semicolons.
   * This makes ";%" boundary detection reliable.
   */
  private stripWhitespace(description: string): string {
    let result = "";
    let i = 0;
    while (i < description.length) {
      if (description[i] === ";") {
        result += ";";
        i++;
        // Skip whitespace after semicolon (but not the next '%')
        while (i < description.length && /\s/.test(description[i])) {
          i++;
        }
      } else {
        result += description[i];
        i++;
      }
    }
    return result;
  }

  /**
   * Split a description into individual rule-set description strings.
   *
   * Rule sets are delimited by ";%" (semicolon before a %-prefixed name).
   * The first rule set may or may not have a % prefix.
   */
  private splitIntoRuleSetDescriptions(description: string): string[] {
    const descriptions: string[] = [];
    let start = 0;

    // Find each ";%" boundary
    let i = 0;
    while (i < description.length) {
      if (description[i] === ";" && i + 1 < description.length && description[i + 1] === "%") {
        // Found a boundary — the current rule set ends at ';'
        const segment = description.substring(start, i + 1); // include the ';'
        if (segment.trim().length > 0) {
          descriptions.push(segment);
        }
        start = i + 1; // next rule set starts at '%'
        i = start;
      } else {
        i++;
      }
    }

    // Last segment
    if (start < description.length) {
      const segment = description.substring(start);
      if (segment.trim().length > 0) {
        descriptions.push(segment);
      }
    }

    return descriptions;
  }

  /**
   * Select the default rule set.
   * Prefers: %spellout-numbering > %digits-ordinal > %duration
   * Falls back to the last public rule set.
   */
  private initDefaultRuleSet(): void {
    const preferred = ["%spellout-numbering", "%digits-ordinal", "%duration"];

    for (const name of preferred) {
      const rs = this.findRuleSetByName(name);
      if (rs && rs.isPublic()) {
        this.defaultRuleSet = rs;
        return;
      }
    }

    // Fall back to last public rule set
    for (let i = this.ruleSets.length - 1; i >= 0; i--) {
      if (this.ruleSets[i].isPublic()) {
        this.defaultRuleSet = this.ruleSets[i];
        return;
      }
    }

    // If no public rule sets, use the last one
    this.defaultRuleSet = this.ruleSets[this.ruleSets.length - 1];
  }

  private findRuleSetByName(name: string): NFRuleSet | null {
    for (const rs of this.ruleSets) {
      if (rs.getName() === name) {
        return rs;
      }
    }
    return null;
  }

  // ==================================================================
  // IFormatter implementation
  // ==================================================================

  /** @internal */
  resolveRuleSet(name: string): INFRuleSet {
    const rs = this.findRuleSetByName(name);
    if (!rs) {
      throw new Error(`Unknown rule set: ${name}`);
    }
    return rs;
  }

  /** @internal */
  createNumberFormat(pattern: string): INumberFormat {
    return createNumberFormat(this.locale, pattern);
  }

  /** @internal */
  createPluralFormat(type: PluralType, pattern: string): IPluralFormat {
    return createPluralFormat(this.locale, type, pattern);
  }

  /** @internal */
  getDefaultNaNRule(): INFRule | null {
    if (!this.defaultNaNRule) {
      this.defaultNaNRule = new NFRule(this, "NaN: NaN");
    }
    return this.defaultNaNRule;
  }

  /** @internal */
  getDefaultInfinityRule(): INFRule | null {
    if (!this.defaultInfinityRule) {
      this.defaultInfinityRule = new NFRule(this, "Inf: \u221E");
    }
    return this.defaultInfinityRule;
  }

  // ==================================================================
  // Public API
  // ==================================================================

  /**
   * Format a number to text.
   *
   * @param number       The number to format
   * @param ruleSetName  Optional rule set name (e.g., "%spellout-cardinal").
   *                     If omitted, uses the default rule set.
   * @returns The formatted string
   */
  format(number: number, ruleSetName?: string): string {
    let ruleSet: NFRuleSet;

    if (ruleSetName !== undefined) {
      const rs = this.findRuleSetByName(ruleSetName);
      if (!rs) {
        throw new Error(`Unknown rule set: ${ruleSetName}`);
      }
      if (!rs.isPublic()) {
        throw new Error(`Rule set ${ruleSetName} is not public`);
      }
      ruleSet = rs;
    } else {
      ruleSet = this.defaultRuleSet;
    }

    const output = [""];
    ruleSet.format(number, output, 0, 0);
    return output[0];
  }

  /**
   * Parse text back to a number.
   *
   * Tries all public, parseable rule sets and returns the result
   * from the one that matched the most characters (greedy).
   */
  parse(text: string): number {
    let bestResult = 0;
    let bestIndex = 0;

    for (const rs of this.ruleSets) {
      if (!rs.isPublic() || !rs.isParseable()) continue;

      const pos: ParsePosition = { index: 0, errorIndex: -1 };
      const result = rs.parse(text, pos, Number.MAX_SAFE_INTEGER, 0, 0);

      if (pos.index > bestIndex) {
        bestIndex = pos.index;
        bestResult = result;
      }
    }

    return bestResult;
  }

  /**
   * Get all public rule set names.
   */
  getRuleSetNames(): string[] {
    return this.ruleSets.filter(rs => rs.isPublic()).map(rs => rs.getName());
  }

  /**
   * Get the name of the current default rule set.
   */
  getDefaultRuleSetName(): string {
    return this.defaultRuleSet.getName();
  }

  /**
   * Set the default rule set by name.
   */
  setDefaultRuleSet(name: string): void {
    const rs = this.findRuleSetByName(name);
    if (!rs) {
      throw new Error(`Unknown rule set: ${name}`);
    }
    if (!rs.isPublic()) {
      throw new Error(`Rule set ${name} is not public`);
    }
    this.defaultRuleSet = rs;
  }

  /**
   * Get the original rules string.
   */
  getRules(): string {
    return this.originalRules;
  }
}
