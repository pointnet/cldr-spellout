---
sidebar_position: 5
title: Examples
---

# Examples

## Basic formatting

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const en = RuleBasedNumberFormat.fromLocale("en");

en.format(0);            // "zero"
en.format(1);            // "one"
en.format(13);           // "thirteen"
en.format(100);          // "one hundred"
en.format(1000);         // "one thousand"
en.format(1000000);      // "one million"
en.format(1000000000);   // "one billion"
```

## Negative numbers

```typescript
en.format(-1);   // "minus one"
en.format(-42);  // "minus thirty-six"
```

## Decimal numbers

```typescript
en.format(3.14);    // "three point one four"
en.format(0.5);     // "zero point five"
en.format(1.001);   // "one point zero zero one"
```

## Ordinals

Use the `%digits-ordinal` rule set when available:

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.format(1, "%digits-ordinal");   // "1st"
fmt.format(2, "%digits-ordinal");   // "2nd"
fmt.format(3, "%digits-ordinal");   // "3rd"
fmt.format(4, "%digits-ordinal");   // "4th"
fmt.format(11, "%digits-ordinal");  // "11th"
fmt.format(21, "%digits-ordinal");  // "21st"
fmt.format(22, "%digits-ordinal");  // "22nd"
```

French ordinals spell out fully:

```typescript
const fr = RuleBasedNumberFormat.fromLocale("fr");

fr.format(1, "%spellout-ordinal");   // "premier"
fr.format(2, "%spellout-ordinal");   // "deuxième"
fr.format(42, "%spellout-ordinal");  // "quarante-deuxième"
```

## Changing the default rule set

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");
fmt.setDefaultRuleSet("%digits-ordinal");

fmt.format(1);  // "1st"
fmt.format(2);  // "2nd"
fmt.format(3);  // "3rd"
```

## Parse: words → number

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.parse("forty-two");          // 42
fmt.parse("one thousand");       // 1000
fmt.parse("minus thirty-six");   // -36
```

Round-trip:

```typescript
const n = 12345;
const text = fmt.format(n);         // "twelve thousand three hundred forty-five"
const back = fmt.parse(text);       // 12345
console.log(n === back);            // true
```

## Listing rule sets

```typescript
const de = RuleBasedNumberFormat.fromLocale("de");
de.getRuleSetNames();
// ["%spellout-numbering-year", "%spellout-numbering",
//  "%spellout-cardinal-masculine", "%spellout-cardinal-feminine",
//  "%spellout-cardinal-neuter", "%spellout-ordinal",
//  "%digits-ordinal-masculine", "%digits-ordinal-feminine",
//  "%digits-ordinal-neuter", ...]
```

## Complex grammatical genders (German)

German has masculine/feminine/neuter cardinal forms:

```typescript
const de = RuleBasedNumberFormat.fromLocale("de");

de.format(1, "%spellout-cardinal-masculine");  // "ein"
de.format(1, "%spellout-cardinal-feminine");   // "eine"
de.format(1, "%spellout-cardinal-neuter");     // "ein"

de.format(2, "%spellout-cardinal-masculine");  // "zwei"
de.format(2, "%spellout-cardinal-feminine");   // "zwei"
```

## Large numbers

```typescript
const en = RuleBasedNumberFormat.fromLocale("en");

en.format(1e6);   // "one million"
en.format(1e9);   // "one billion"
en.format(1e12);  // "one trillion"
en.format(1e15);  // "one quadrillion"
```

## Special values

```typescript
en.format(Infinity);   // "∞"
en.format(-Infinity);  // "-∞"
en.format(NaN);        // "NaN"
```

## Custom RBNF rules

You can construct a formatter from a raw ICU RBNF rule string:

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const fmt = new RuleBasedNumberFormat(
  `%dozens:
     10: << dozen[s];
     100: <<[, >>];
     1000: <<[, >>];`,
  "en",
);

fmt.format(10);  // "1 dozen"
fmt.format(20);  // "2 dozens"
fmt.format(120); // "12 dozens"
```

## Loading custom locale data

Supply your own CLDR RBNF JSON if you need a locale not in the built-in set, or want to
override the rules. The duration example below defines a custom rule set that formats seconds
as `H:MM:SS`:

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
import type { IRBNFData } from "@pointnet/cldr-spellout";

const durationData: IRBNFData = {
  rbnf: {
    identity: { language: "en" },
    rbnf: {
      DurationRules: {
        "%%min-sec":  [["0", ":=00="]],
        "%duration":  [
          ["0",         "=%%seconds="],
          ["60/60",     "<0<>%%min-sec>"],
          ["3600/3600", "<0<:>%%min-sec>"],
        ],
        "%%seconds":  [
          ["0", "0 sec."],
          ["1", "1 sec."],
          ["2", "=#,##0= sec."],
        ],
      },
    },
  },
};

const fmt = RuleBasedNumberFormat.fromCldrData(durationData);
fmt.format(3662); // "1:01:02"
```

## Get all supported locales

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const locales = RuleBasedNumberFormat.getSupportedLocales();
console.log(locales.length); // 89
console.log(locales[0]);     // "af"
```
