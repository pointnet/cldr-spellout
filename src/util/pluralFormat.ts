import type { IPluralFormat, PluralType } from "../types.js";

/**
 * Parse a plural pattern into category→text branches.
 *
 * Pattern format: `key{value}key{value}...`
 * Example: `one{тысяча}few{тысячи}other{тысяч}`
 */
function parsePluralPattern(pattern: string): Map<string, string> {
  const branches = new Map<string, string>();
  let i = 0;

  while (i < pattern.length) {
    // Skip whitespace
    while (i < pattern.length && /\s/.test(pattern[i])) i++;
    if (i >= pattern.length) break;

    // Read key (until '{')
    const keyStart = i;
    while (i < pattern.length && pattern[i] !== "{") i++;
    if (i >= pattern.length) break;

    const key = pattern.substring(keyStart, i).trim();
    i++; // skip '{'

    // Read value (until matching '}', handling nested braces)
    let depth = 1;
    const valStart = i;
    while (i < pattern.length && depth > 0) {
      if (pattern[i] === "{") depth++;
      else if (pattern[i] === "}") depth--;
      if (depth > 0) i++;
    }
    const value = pattern.substring(valStart, i);
    i++; // skip '}'

    if (key.length > 0) {
      branches.set(key, value);
    }
  }

  return branches;
}

/**
 * Create an IPluralFormat from a plural pattern using Intl.PluralRules.
 */
export function createPluralFormat(
  locale: string,
  type: PluralType,
  pattern: string,
): IPluralFormat {
  const branches = parsePluralPattern(pattern);
  const rules = new Intl.PluralRules(locale, { type });

  return {
    format(n: number): string {
      const category = rules.select(n);
      // Try exact category, then fall back to 'other'
      const text = branches.get(category) ?? branches.get("other") ?? "";
      return text;
    },
  };
}
