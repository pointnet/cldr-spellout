# RuleBasedNumberFormat C++ Dependencies

## Class Hierarchy

```
Format → NumberFormat → RuleBasedNumberFormat
```

## Public Header Dependencies (`unicode/rbnf.h`)

| Header | Class/Purpose |
|---|---|
| `unicode/numfmt.h` | `NumberFormat` base class |
| `unicode/unistr.h` | `UnicodeString` |
| `unicode/locid.h` | `Locale` |
| `unicode/dcfmtsym.h` | `DecimalFormatSymbols` |
| `unicode/fmtable.h` | `Formattable` |
| `unicode/strenum.h` | `StringEnumeration` |
| `unicode/brkiter.h` | `BreakIterator` |
| `unicode/upluralrules.h` | Plural rules |
| `unicode/utypes.h` | Core ICU types |

## Internal Supporting Classes

| Class | Files | Purpose |
|---|---|---|
| **NFRuleSet** | `nfrs.h` / `nfrs.cpp` | Collection of rules for a formatting context |
| **NFRule** | `nfrule.h` / `nfrule.cpp` | Individual number formatting rules |
| **NFSubstitution** | `nfsubs.h` / `nfsubs.cpp` | Substitution tokens (`<<`, `>>`) with subclasses: `MultiplierSubstitution`, `ModulusSubstitution`, `FractionalPartSubstitution`, `NumeratorSubstitution`, etc. |
| **NFRuleList** | `nfrlist.h` | Dynamic array container for NFRule objects |
| **LocalizationInfo** | defined in `rbnf.cpp` | Localized display names for rule sets |

## Additional Implementation Dependencies (`rbnf.cpp`)

**Public ICU headers:** `normlzr.h`, `plurfmt.h`, `tblcoll.h`, `uchar.h`, `ucol.h`, `uloc.h`, `unum.h`, `ures.h`, `ustring.h`, `utf16.h`, `udata.h`, `udisplaycontext.h`, `ucasemap.h`

**Internal headers:** `cmemory.h`, `cstring.h`, `patternprops.h`, `uresimp.h`, `number_decimalquantity.h`, `putilimp.h`

## CLDR Resource Bundle Data

Rules are loaded from ICU's `rbnf` resource bundle:

```
U_ICUDATA_RBNF/"RBNFRules"/{format_key}
```

With four format keys:
- **`SpelloutRules`** — numbers to words ("one hundred twenty-three")
- **`OrdinalRules`** — ordinal formatting ("123rd")
- **`DurationRules`** — time duration (deprecated ICU 74)
- **`NumberingSystemRules`** — Roman numerals, Hebrew numbers, etc.

Additionally loads `contextTransforms/number-spellout` for capitalization context.

## Key Member Variables

- `NFRuleSet **fRuleSets` — array of rule sets
- `DecimalFormatSymbols *decimalFormatSymbols` — locale number symbols
- `RuleBasedCollator *collator` — for lenient parsing
- `NFRule *defaultInfinityRule` / `defaultNaNRule` — special value rules
- `BreakIterator *capitalizationBrkIter` — context-sensitive capitalization

## Architecture

The core architecture: `RuleBasedNumberFormat` orchestrates `NFRuleSet` instances, each containing `NFRule` objects that use `NFSubstitution` subclasses for recursive formatting.
