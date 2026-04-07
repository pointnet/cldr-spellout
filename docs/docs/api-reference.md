---
sidebar_position: 2
title: API Reference
---

# API Reference

## `RuleBasedNumberFormat`

The main class. Exported from `@pointnet/cldr-spellout`.

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
```

---

### Static methods

#### `RuleBasedNumberFormat.fromLocale(locale)`

Creates a formatter from one of the 89 built-in CLDR locales.

| Parameter | Type | Description |
|-----------|------|-------------|
| `locale` | `string` | BCP 47 locale tag (e.g. `"en"`, `"fr"`, `"zh-Hant"`) |

**Returns** `RuleBasedNumberFormat`

**Throws** if the locale is not supported. Use `getSupportedLocales()` to check first.

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("de");
fmt.format(100); // "einhundert"
```

---

#### `RuleBasedNumberFormat.fromCldrData(data, locale?)`

Creates a formatter from a raw `cldr-rbnf` JSON object. Useful when you need a locale not in the
built-in set, or when loading locale data dynamically.

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `IRBNFData` | CLDR RBNF JSON (shape of a `cldr-rbnf/rbnf/*.json` file) |
| `locale` | `string?` | Optional locale tag override. Defaults to the identity in the JSON. |

**Returns** `RuleBasedNumberFormat`

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

---

#### `RuleBasedNumberFormat.getSupportedLocales()`

Returns the list of all 89 supported BCP 47 locale tags.

**Returns** `string[]`

```typescript
const locales = RuleBasedNumberFormat.getSupportedLocales();
// ["af", "ak", "am", "ar", ..., "zh-Hant"]
```

---

### Constructor

#### `new RuleBasedNumberFormat(rules, locale?)`

Constructs a formatter from an ICU RBNF rule string. Useful for custom or experimental rule sets.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rules` | `string` | ICU RBNF rule description string |
| `locale` | `string?` | Locale tag for plural rules. Defaults to `"en"`. |

```typescript
const fmt = new RuleBasedNumberFormat(
  "%dozens: 10: << dozen[s]; 100: <<[, >>]; 1000: <<[, >>];",
  "en",
);
fmt.format(24); // "2 dozens"
```

---

### Instance methods

#### `format(number, ruleSetName?)`

Formats a number as spelled-out text.

| Parameter | Type | Description |
|-----------|------|-------------|
| `number` | `number` | The number to format |
| `ruleSetName` | `string?` | Rule set to use. Defaults to the current default rule set. |

**Returns** `string`

Special values:
- `Infinity` → `"∞"` (or locale equivalent)
- `-Infinity` → `"-∞"` (or locale equivalent)
- `NaN` → `"NaN"`

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.format(0);                        // "zero"
fmt.format(1000000);                  // "one million"
fmt.format(-42);                      // "minus forty-two"
fmt.format(3.14);                     // "three point one four"
fmt.format(1, "%digits-ordinal");     // "1st"
fmt.format(Infinity);                 // "∞"
```

---

#### `parse(text)`

Parses spelled-out text back to a number. Tries all public rule sets and returns the best
(longest) match.

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Spelled-out text to parse |

**Returns** `number`

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");

fmt.parse("forty-two");          // 42
fmt.parse("one million");        // 1000000
fmt.parse("minus thirty-six");   // -36
```

---

#### `getRuleSetNames()`

Returns all *public* rule set names for this formatter (names not starting with `%%`).

**Returns** `string[]`

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");
fmt.getRuleSetNames();
// ["%spellout-numbering-year", "%spellout-numbering",
//  "%spellout-cardinal-verbose", "%spellout-ordinal",
//  "%spellout-ordinal-verbose", "%digits-ordinal"]
```

---

#### `getDefaultRuleSetName()`

Returns the name of the current default rule set.

**Returns** `string`

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");
fmt.getDefaultRuleSetName(); // "%spellout-numbering"
```

---

#### `setDefaultRuleSet(name)`

Changes the default rule set used when `format()` is called without a `ruleSetName`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Rule set name (must be in `getRuleSetNames()`) |

**Returns** `void`

```typescript
const fmt = RuleBasedNumberFormat.fromLocale("en");
fmt.setDefaultRuleSet("%digits-ordinal");
fmt.format(3); // "3rd"
```

---

#### `getRules()`

Returns the original RBNF rule description string. Useful for debugging or introspection.

**Returns** `string`

---

## `IRBNFData`

The shape of a `cldr-rbnf` locale JSON file, as consumed by `fromCldrData()`.

```typescript
import type { IRBNFData } from "@pointnet/cldr-spellout";
```

The actual shape mirrors the `cldr-rbnf` package output — a nested object with locale identity
and rule set definitions.
