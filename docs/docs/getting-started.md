---
sidebar_position: 1
title: Getting Started
---

# Getting Started

`@pointnet/cldr-spellout` converts numbers to spelled-out words across 89 locales, using data from [`cldr-rbnf`](https://www.npmjs.com/package/cldr-rbnf) v48 (Unicode CLDR 48).
It is a TypeScript implementation of [ICU Rule-Based Number Formatting (RBNF)](https://unicode-org.github.io/icu/userguide/format_parse/numbers/rbnf.html).

## Requirements

- **Node.js** ≥ 24 (for the ESM build with JSON import attributes)
- **Browsers**: fully supported (Webpack / Vite bundle the locale data at build time)
- **TypeScript**: types included, no `@types/` package needed

## Installation

```bash
npm install @pointnet/cldr-spellout
```

## Quick Start

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.format(42);           // "forty-two"
fmt.format(1001);         // "one thousand one"
fmt.format(-7);           // "minus seven"
fmt.format(3.14);         // "three point one four"
```

## Ordinals

Many locales include an ordinal rule set:

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.format(1, "%digits-ordinal");  // "1st"
fmt.format(2, "%digits-ordinal");  // "2nd"
fmt.format(11, "%digits-ordinal"); // "11th"
fmt.format(21, "%digits-ordinal"); // "21st"
```

## List available rule sets

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.getRuleSetNames();
// ["%spellout-numbering-year", "%spellout-numbering", "%spellout-cardinal-verbose",
//  "%spellout-ordinal", "%spellout-ordinal-verbose", "%digits-ordinal"]
```

## Parse (words → number)

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.parse("forty-two");          // 42
fmt.parse("one thousand one");   // 1001
fmt.parse("minus seven");        // -7
```

## Multiple locales

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const locales = ["en", "de", "fr", "ja"];
const n = 42;

for (const locale of locales) {
  const fmt = RuleBasedNumberFormat.fromLocale(locale);
  console.log(`${locale}: ${fmt.format(n)}`);
}
// en: forty-two
// de: zweiundvierzig
// fr: quarante-deux
// ja: 四十二
```

## Supported locales

See the [Supported Locales](./supported-locales) page for the full list of 89 locale tags.

Use `RuleBasedNumberFormat.getSupportedLocales()` at runtime to get the list programmatically.
