# @pointnet/cldr-spellout

[![npm version](https://img.shields.io/npm/v/@pointnet/cldr-spellout)](https://www.npmjs.com/package/@pointnet/cldr-spellout)
[![license](https://img.shields.io/npm/l/@pointnet/cldr-spellout)](./LICENSE)

**[Documentation & live playground →](https://pointnet.github.io/cldr-spellout/)**

TypeScript implementation of ICU Rule-Based Number Formatting (RBNF) — converts numbers to words across 89 CLDR locales.

```ts
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const fmt = RuleBasedNumberFormat.fromLocale("en");
fmt.format(123);                      // "one hundred twenty-three"
fmt.format(1, "%digits-ordinal");     // "1st"
fmt.parse("forty-two");               // 42
```

## Features

- **89 CLDR locales** — all locales from [`cldr-rbnf`](https://www.npmjs.com/package/cldr-rbnf) v48 (Unicode CLDR 48)
- **Spellout & ordinals** — cardinal numbers, ordinals, and more depending on locale
- **Parse** — convert spelled-out text back to numbers
- **Custom rules** — construct a formatter from your own RBNF rule string
- **Synchronous** — no async, no dynamic imports; works in Node.js and browsers
- **Dual ESM/CJS** — ships both formats; tree-shakeable (`"sideEffects": false`)

## Installation

```
npm install @pointnet/cldr-spellout
```

Requires **Node.js ≥ 24** (for native ESM JSON imports). Browser bundles are unaffected.

## Usage

### Load a built-in locale

```ts
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

const en = RuleBasedNumberFormat.fromLocale("en");
en.format(1000);   // "one thousand"
en.format(0.5);    // "zero point five"
en.format(-7);     // "minus seven"

const fr = RuleBasedNumberFormat.fromLocale("fr");
fr.format(71);     // "soixante-et-onze"
fr.format(80);     // "quatre-vingts"

const de = RuleBasedNumberFormat.fromLocale("de");
de.format(42);     // "zweiundvierzig"
```

### Ordinals and other rule sets

Each locale exposes one or more named rule sets. Pass a rule set name as the second argument to `format()`:

```ts
const en = RuleBasedNumberFormat.fromLocale("en");

en.format(1,  "%digits-ordinal");  // "1st"
en.format(2,  "%digits-ordinal");  // "2nd"
en.format(13, "%digits-ordinal");  // "13th"

// List available rule sets
en.getRuleSetNames();
// → ["%spellout-numbering", "%spellout-numbering-year",
//    "%spellout-cardinal", "%spellout-ordinal", "%digits-ordinal", ...]
```

### Parse words to a number

```ts
const en = RuleBasedNumberFormat.fromLocale("en");
en.parse("one hundred twenty-three");  // 123
en.parse("forty-two");                 // 42
```

### Load from raw CLDR data

`fromCldrData()` accepts any object matching the `IRBNFData` shape — useful when you supply your own rule data rather than a locale file:

```ts
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
import type { IRBNFData } from "@pointnet/cldr-spellout";

const durationData: IRBNFData = {
  rbnf: {
    identity: { language: "en" },
    rbnf: {
      DurationRules: {
        "%%min-sec":  [["0", ":=00="]],
        "%duration":  [
          ["0",        "=%%seconds="],
          ["60/60",    "<0<>%%min-sec>"],
          ["3600/3600","<0<:>%%min-sec>"],
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
fmt.format(3662);  // "1:01:02"
```

### Custom rule string

You can construct a formatter from any ICU RBNF rule description string:

```ts
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";

// Custom duration rules (adapted from ICU test suite)
const rules = `
%%min-sec:
    0: :=00=;
%duration:
    0: =%%seconds=;
    60/60: <0<>%%min-sec>;
    3600/3600: <0<:>%%min-sec>;
%%seconds:
    0: 0 sec.;
    1: 1 sec.;
    2: =#,##0= sec.;
`;

const fmt = new RuleBasedNumberFormat(rules, "en");
fmt.format(3662);  // "1:01:02"
```

## API

### Static methods

| Method | Description |
|--------|-------------|
| `RuleBasedNumberFormat.fromLocale(locale)` | Create a formatter from a built-in CLDR locale. Throws if the locale is unsupported. |
| `RuleBasedNumberFormat.fromCldrData(data, locale?)` | Create a formatter from a raw `IRBNFData` object. `locale` defaults to the identity in the JSON. |
| `RuleBasedNumberFormat.getSupportedLocales()` | Returns an array of all 89 supported BCP 47 locale tags. |

### Constructor

```ts
new RuleBasedNumberFormat(rules: string, locale?: string)
```

Construct from an ICU RBNF rule description string. `locale` is a BCP 47 tag used for `Intl.NumberFormat` / `Intl.PluralRules` (default: `"en"`).

### Instance methods

| Method | Description |
|--------|-------------|
| `format(number, ruleSetName?)` | Format a number to text. Uses the default rule set unless `ruleSetName` is given. |
| `parse(text)` | Parse spelled-out text back to a number. Tries all public rule sets and returns the best match. |
| `getRuleSetNames()` | Returns all public rule set names (e.g., `["%spellout-numbering", "%digits-ordinal"]`). |
| `getDefaultRuleSetName()` | Returns the name of the active default rule set. |
| `setDefaultRuleSet(name)` | Change the default rule set used when `format()` is called without a rule set name. |
| `getRules()` | Returns the original rule description string. |

### Types

```ts
import type { IRBNFData } from "@pointnet/cldr-spellout";
```

`IRBNFData` is the shape of a `cldr-rbnf` locale JSON file, accepted by `fromCldrData()`.

## Supported Locales

89 BCP 47 locale tags:

`af` `ak` `am` `ar` `az` `be` `bg` `bs` `ca` `ccp` `chr` `cs` `cy` `da` `de` `de-CH` `ee` `el` `en` `en-IN` `eo` `es` `es-419` `et` `fa` `fa-AF` `ff` `fi` `fil` `fo` `fr` `fr-BE` `fr-CH` `ga` `gu` `he` `hi` `hr` `hu` `hy` `id` `is` `it` `ja` `ka` `kk` `kl` `km` `ko` `ky` `lb` `lo` `lrc` `lt` `lv` `mk` `ms` `mt` `my` `ne` `nl` `nn` `no` `pl` `pt` `pt-PT` `qu` `ro` `ru` `se` `sk` `sl` `sq` `sr` `sr-Latn` `su` `sv` `sw` `ta` `th` `tr` `uk` `und` `vec` `vi` `yue` `yue-Hans` `zh` `zh-Hant`

Use `RuleBasedNumberFormat.getSupportedLocales()` at runtime to get the full list.

## License

MIT © pointnet
