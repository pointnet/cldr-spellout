import type { INumberFormat, ParsePosition } from "../types.js";

/**
 * Parse a DecimalFormat-style pattern into Intl.NumberFormat options.
 *
 * Supports the patterns actually used in RBNF rules:
 *   #,##0  — integer with grouping
 *   0      — plain integer
 *   00     — zero-padded integer (2 digits)
 *   0.0    — one required decimal place
 *   0.#    — up to one optional decimal place
 *   #,##0.# — grouped with optional decimal
 *   #0     — basic integer
 */
function parseDecimalPattern(pattern: string): Intl.NumberFormatOptions {
  const opts: Intl.NumberFormatOptions = {
    useGrouping: false,
    minimumIntegerDigits: 1,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  const dotPos = pattern.indexOf(".");
  const intPart = dotPos >= 0 ? pattern.substring(0, dotPos) : pattern;
  const fracPart = dotPos >= 0 ? pattern.substring(dotPos + 1) : "";

  // Grouping: present if comma in integer part
  if (intPart.includes(",")) {
    opts.useGrouping = true;
  }

  // Minimum integer digits: count of '0' in integer part (ignoring # and ,)
  const intDigits = intPart.replace(/[^0]/g, "");
  opts.minimumIntegerDigits = Math.max(1, intDigits.length);

  // Fraction digits
  if (fracPart.length > 0) {
    opts.minimumFractionDigits = (fracPart.match(/0/g) || []).length;
    opts.maximumFractionDigits = fracPart.length; // total of 0 and # chars
  }

  return opts;
}

/**
 * Create an INumberFormat from a DecimalFormat-style pattern using Intl.NumberFormat.
 */
export function createNumberFormat(locale: string, pattern: string): INumberFormat {
  const opts = parseDecimalPattern(pattern);
  const fmt = new Intl.NumberFormat(locale, opts);

  return {
    format(n: number): string {
      return fmt.format(n);
    },

    parse(text: string, pos: ParsePosition): number {
      // Simple numeric parser: scan digits, grouping separators, decimal point, minus
      let i = pos.index;
      let numStr = "";
      let hasDecimal = false;
      const len = text.length;

      // Optional minus sign
      if (i < len && text[i] === "-") {
        numStr += "-";
        i++;
      }

      while (i < len) {
        const ch = text[i];
        if (ch >= "0" && ch <= "9") {
          numStr += ch;
          i++;
        } else if (ch === "," || ch === "\u00A0" || ch === ".") {
          // Could be grouping separator or decimal point
          if ((ch === "." || ch === ",") && !hasDecimal) {
            // Look ahead: if followed by digits and then end or non-digit,
            // treat as decimal point if it's '.' or if locale uses ',' as decimal
            const next = i + 1 < len ? text[i + 1] : "";
            if (ch === ".") {
              hasDecimal = true;
              numStr += ".";
              i++;
            } else if (ch === ",") {
              // Could be grouping or decimal — check if grouped pattern
              if (opts.useGrouping && next >= "0" && next <= "9") {
                // Treat as grouping separator (skip it)
                i++;
              } else {
                break;
              }
            }
          } else if (ch === "," && opts.useGrouping) {
            // Additional grouping separator
            i++;
          } else if (ch === "\u00A0") {
            // Non-breaking space as grouping separator
            i++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (numStr.length === 0 || numStr === "-") {
        pos.errorIndex = pos.index;
        return 0;
      }

      pos.index = i;
      return Number(numStr);
    },
  };
}
