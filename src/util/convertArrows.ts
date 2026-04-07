/**
 * Convert Unicode arrows used in cldr-rbnf JSON to the ASCII equivalents
 * that NFRule expects.
 *
 *   → (U+2192) → >
 *   ← (U+2190) → <
 *   − (U+2212) → -
 */
export function convertArrows(text: string): string {
  return text
    .replace(/\u2192/g, ">")
    .replace(/\u2190/g, "<")
    .replace(/\u2212/g, "-");
}
