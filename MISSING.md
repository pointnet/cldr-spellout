### **What is missing**

LocalizationInfo — display name localization for rule sets (cosmetic, not functional)

Lenient parsing — RuleBasedCollator-based fuzzy matching (complex ICU dependency; basic case-insensitive parsing already in NFRule)

Capitalization context — BreakIterator-based title-casing (can add later)

DecimalFormatSymbols switching — runtime locale changes (we're immutable-per-instance)

Rounding mode — setRoundingMode() (niche, add later if needed)
