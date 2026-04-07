---
sidebar_position: 4
title: The `und` Locale
---

# The `und` Locale

The `und` locale (BCP 47 for "undetermined" — the CLDR root locale) is unlike all other 88 locales
in this library. Rather than spelling numbers out in a natural language, it provides **historic and
non-Latin numeral systems** alongside plain numeric fallbacks.

Use it to convert numbers into Roman, Greek, Hebrew, Armenian, Cyrillic, Ethiopic, Georgian, or
Tamil numerals.

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const und = RuleBasedNumberFormat.fromLocale("und");

und.format(42, "%roman-upper");   // "XLII"
und.format(42, "%greek-lower");   // "μβ´"
und.format(42, "%hebrew");        // "מ״ב"
und.format(42, "%ethiopic");      // "፵፪"
und.format(42, "%tamil");         // "௪௰௨"
```

## Historic numeral systems

| Rule set | Script | 1 | 10 | 42 | 100 | 1000 |
|---|---|---|---|---|---|---|
| `%roman-lower` | Roman (lowercase) | i | x | xlii | c | m |
| `%roman-upper` | Roman (uppercase) | I | X | XLII | C | M |
| `%greek-lower` | Greek (lowercase) | α´ | ι´ | μβ´ | ρ´ | ͵α´ |
| `%greek-upper` | Greek (uppercase) | Α´ | Ι´ | ΜΒ´ | Ρ´ | ͵Α´ |
| `%armenian-lower` | Armenian (lowercase) | ա | ժ | խբ | ճ | ռ |
| `%armenian-upper` | Armenian (uppercase) | Ա | Ժ | ԽԲ | Ճ | Ռ |
| `%cyrillic-lower` | Cyrillic numerals | а҃ | і҃ | м҃в | р҃ | ҂а҃ |
| `%ethiopic` | Ethiopic | ፩ | ፲ | ፵፪ | ፻ | ፲፻ |
| `%georgian` | Georgian | ა | ი | მბ | რ | შ |
| `%hebrew` | Hebrew (with punctuation) | א׳ | י׳ | מ״ב | ק׳ | אלף |
| `%hebrew-item` | Hebrew (bare, no geresh) | א | י | מב | ק | תתר |
| `%tamil` | Tamil | ௧ | ௰ | ௪௰௨ | ௱ | ௲ |

:::note Range limits
Numbers beyond a system's historical range fall back to decimal digits. For example, Roman numerals
fall back above 3,999; Armenian and Georgian above 9,999.
:::

## Numeric fallbacks

The remaining rule sets produce formatted decimal digits rather than a different numeral script.
They are useful when you need a consistent API regardless of locale but still want the standard
CLDR rule-set names.

| Rule set | Description | Example (3,662) |
|---|---|---|
| `%spellout-numbering` | Comma-formatted digits | `3,662` |
| `%spellout-cardinal` | Same as `%spellout-numbering` | `3,662` |
| `%spellout-ordinal` | Digits with trailing period | `3,662.` |
| `%digits-ordinal` | Digits with trailing period | `3,662.` |
| `%spellout-numbering-year` | Plain digits, no thousands separator | `3662` |
| `%zz-default` | Comma-formatted digits | `3,662` |

## Full example

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const und = RuleBasedNumberFormat.fromLocale("und");
const year = 2024;

console.log(und.format(year, "%roman-upper"));      // "MMXXIV"
console.log(und.format(year, "%greek-upper"));      // "͵ΒΚΔ´"
console.log(und.format(year, "%armenian-upper"));   // "ՍԻԴ"
console.log(und.format(year, "%hebrew"));           // "ב׳כ״ד"
console.log(und.format(year, "%ethiopic"));         // "፳፻፳፬"
```
