---
sidebar_position: 6
title: "Tutorial: Game Ranking System"
---

# Tutorial: Building a Game Ranking System

What if a number formatter could tell you your rank?

In this tutorial you will build a complete custom rule set using `IRBNFData` that converts raw XP values into human-readable ranks — just like the ladder systems you find in competitive games. Along the way you'll learn the core mechanics of RBNF rule authoring: rule matching, the radix/divisor relationship, the modulus substitution (`>>`), and private helper rule sets (`%%`).

## The ranking system

| XP range | Rank | Sub-levels |
|---|---|---|
| 0 – 399 | Unranked | — |
| 400 – 799 | Iron | 1 – 4 (100 XP each) |
| 800 – 1 299 | Bronze | 1 – 4 (125 XP each) |
| 1 300 – 1 899 | Silver | 1 – 4 (150 XP each) |
| 1 900 – 2 599 | Gold | 1 – 4 (175 XP each) |
| 2 600 – 3 399 | Platinum | 1 – 4 (200 XP each) |
| 3 400 – 4 299 | Emerald | 1 – 4 (225 XP each) |
| 4 300 – 5 299 | Diamond | 1 – 4 (250 XP each) |
| 5 300 – 6 399 | Master | 1 – 4 (275 XP each) |
| 6 400 – 7 599 | Grandmaster | 1 – 4 (300 XP each) |
| 7 600 – 8 649 | Challenger | 1 – 3 (350 XP each) |
| 8 650 + | Challenger 4 | — |

**Goal:** `format(550)` → `"Iron 2"`, `format(1450)` → `"Silver 2"`, `format(8650)` → `"Challenger 4"`.

## What you will learn

- The shape of the `IRBNFData` interface
- How RBNF rules are matched (binary search on base values)
- The `base/radix` descriptor and how it controls the divisor
- The modulus substitution `>>` — extracting the position within a tier
- Private rule sets (`%%`) — helper rules invisible to callers

---

## Step 1 — The `IRBNFData` skeleton

Every custom formatter starts from an `IRBNFData` object. The interface has three levels:

```
IRBNFData
└── rbnf
    ├── identity       { language, territory? }
    └── rbnf           Record<groupName, Record<ruleSetName, [descriptor, body][]>>
```

- **`identity`** — a locale tag. The formatter uses it when resolving plural forms.
- **`rbnf`** — a two-level map. The outer key is a group name (any string — used for organisation only). The inner key is the rule set name, prefixed with `%` for public sets and `%%` for private ones.
- **Each rule set** is an array of `[descriptor, body]` pairs — the descriptor is a base value (like `"400"`) and the body is the text template for that rule.

:::important Rule body semicolons
Every body string **must end with a semicolon** (`;`). The parser splits rule sets by detecting the `";%"` character sequence — the trailing `;` of the last rule in a set, followed by the `%` of the next set's name. Omitting the semicolons causes all rule sets to be parsed as one.
:::

Here is the bare skeleton — one empty public rule set:

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
import type { IRBNFData } from "@pointnet/cldr-spellout";

const rankingData: IRBNFData = {
  rbnf: {
    identity: { language: "en" },
    rbnf: {
      RankingRules: {
        "%ranking": [
          // rules go here
        ],
      },
    },
  },
};

const fmt = RuleBasedNumberFormat.fromCldrData(rankingData);
```

---

## Step 2 — Basic tier rules

The simplest rule is a **static rule**: a base value and a fixed label, no substitutions.

```
descriptor: body
```

The formatter selects the rule whose base value is the **highest value that does not exceed the input**. This is a binary search — so rules must be listed in ascending order.

Let's add one static rule per tier:

```typescript
"%ranking": [
  ["0",    "Unranked;"],
  ["400",  "Iron;"],
  ["800",  "Bronze;"],
  ["1300", "Silver;"],
  ["1900", "Gold;"],
  ["2600", "Platinum;"],
  ["3400", "Emerald;"],
  ["4300", "Diamond;"],
  ["5300", "Master;"],
  ["6400", "Grandmaster;"],
  ["7600", "Challenger;"],
],
```

```typescript
fmt.format(0);     // "Unranked"
fmt.format(399);   // "Unranked"   (highest rule ≤ 399 is the rule at 0)
fmt.format(400);   // "Iron"
fmt.format(550);   // "Iron"       (highest rule ≤ 550 is the rule at 400)
fmt.format(1450);  // "Silver"
fmt.format(7600);  // "Challenger"
```

Rule matching in plain English: for XP = 550, the formatter walks the sorted list [0, 400, 800, 1300 …] and finds that 800 > 550, so it picks the previous entry — the rule at 400. Output: `"Iron"`.

We now have the tiers. Next we need the sub-levels.

---

## Step 3 — The radix trick

To produce `"Iron 2"` instead of just `"Iron"`, we need to know **which sub-level** the player is in. The sub-level depends on how far past the tier boundary the XP is.

For Iron (400–799), the tier has 400 XP spread across 4 levels of 100 XP each:

| Iron level | XP range | Offset from 400 |
|---|---|---|
| Iron 1 | 400 – 499 | 0 – 99 |
| Iron 2 | 500 – 599 | 100 – 199 |
| Iron 3 | 600 – 699 | 200 – 299 |
| Iron 4 | 700 – 799 | 300 – 399 |

We need `offset = XP % 400`. To get that, we tell RBNF to use 400 as both the base value **and the radix**:

```
400/400: Iron ...
```

The `/radix` part of the descriptor overrides the default radix of 10. RBNF then computes:

```
exponent = floor(log₄₀₀(400)) = 1
divisor  = 400¹ = 400
```

Any **modulus substitution** (`>>`) in this rule's body will compute `n % divisor = n % 400`:

| XP | n % 400 |
|---|---|
| 400 | 0 |
| 499 | 99 |
| 500 | 100 |
| 550 | 150 |
| 700 | 300 |
| 799 | 399 |

The offset correctly resets to 0 at the start of the tier and increases until the next tier begins.

---

## Step 4 — Private rule sets and the `>>` substitution

Now we need something to **format the offset** (0–399) as a level number (1–4). We use a **private rule set** — a rule set prefixed with `%%`. Private rule sets work exactly like public ones but are not accessible to callers; they exist only as helpers for other rules.

Create `%%iron-levels` with one rule per sub-level:

```typescript
"%%iron-levels": [
  ["0",   "1;"],   // offset 0–99   → level 1
  ["100", "2;"],   // offset 100–199 → level 2
  ["200", "3;"],   // offset 200–299 → level 3
  ["300", "4;"],   // offset 300–399 → level 4
],
```

Then update the Iron rule to delegate to it using `>%%iron-levels>`:

```typescript
["400/400", "Iron >%%iron-levels>;"],
```

The syntax `>name>` is the **modulus substitution**:

1. Compute the remainder: `n % divisor` (here `n % 400`)
2. Format that remainder using the named rule set (here `%%iron-levels`)
3. Append the result after the literal text `"Iron "`

Tracing XP = 550:

```
rule selected: "400/400"
divisor: 400¹ = 400
>> computes: 550 % 400 = 150
%%iron-levels(150): rule at 100 matches (100 ≤ 150 < 200) → "2"
output: "Iron " + "2" = "Iron 2"
```

:::tip The space before `>`
The literal text `"Iron "` (with a trailing space) is what appears before the substitution marker `>`. That space is what separates the tier name from the level number. The helper rule set returns just the digit.
:::

---

## Step 5 — Scaling to all tiers

The same pattern applies to every other tier. For each tier, calculate the **level width** (tier range ÷ 4) to find the helper breakpoints:

| Tier | Range | Width | Helper breakpoints |
|---|---|---|---|
| Iron | 400–799 | 100 | 0, 100, 200, 300 |
| Bronze | 800–1 299 | 125 | 0, 125, 250, 375 |
| Silver | 1 300–1 899 | 150 | 0, 150, 300, 450 |
| Gold | 1 900–2 599 | 175 | 0, 175, 350, 525 |
| Platinum | 2 600–3 399 | 200 | 0, 200, 400, 600 |
| Emerald | 3 400–4 299 | 225 | 0, 225, 450, 675 |
| Diamond | 4 300–5 299 | 250 | 0, 250, 500, 750 |
| Master | 5 300–6 399 | 275 | 0, 275, 550, 825 |
| Grandmaster | 6 400–7 599 | 300 | 0, 300, 600, 900 |
| Challenger | 7 600–8 649 | 350 | 0, 350, 700 (3 levels only) |

For each tier, add a rule with `base/base` descriptor and a `%%tier-levels` helper:

```typescript
["800/800",   "Bronze >%%bronze-levels>;"],
["1300/1300", "Silver >%%silver-levels>;"],
// ... and so on

"%%bronze-levels": [
  ["0",   "1;"],
  ["125", "2;"],
  ["250", "3;"],
  ["375", "4;"],
],
// ... etc.
```

---

## Step 6 — Edge cases

Two rules need special treatment.

**Unranked** is already correct — it's a static rule with no substitution. Any XP from 0 to 399 falls through to it.

**Challenger 4** presents a subtlety. Challenger's rule uses `7600/7600` and a helper with three breakpoints at 0, 350, and 700. But very high XP (say, 8650) would compute `8650 % 7600 = 1050`, which would fall past the last helper rule and produce incorrect output.

The solution: add a **static catch-all rule at exactly 8650** — no substitution, just a fixed label.

```typescript
["7600/7600", "Challenger >%%challenger-levels>;"],
["8650",      "Challenger 4;"],
```

The binary search picks `8650` for any XP ≥ 8650, short-circuiting the modulus arithmetic entirely. The Challenger rule with sub-levels only fires for 7600–8649.

---

## Step 7 — The complete system

```typescript
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
import type { IRBNFData } from "@pointnet/cldr-spellout";

const rankingData: IRBNFData = {
  rbnf: {
    identity: { language: "en" },
    rbnf: {
      RankingRules: {
        "%ranking": [
          ["0",         "Unranked;"],
          ["400/400",   "Iron >%%iron-levels>;"],
          ["800/800",   "Bronze >%%bronze-levels>;"],
          ["1300/1300", "Silver >%%silver-levels>;"],
          ["1900/1900", "Gold >%%gold-levels>;"],
          ["2600/2600", "Platinum >%%platinum-levels>;"],
          ["3400/3400", "Emerald >%%emerald-levels>;"],
          ["4300/4300", "Diamond >%%diamond-levels>;"],
          ["5300/5300", "Master >%%master-levels>;"],
          ["6400/6400", "Grandmaster >%%grandmaster-levels>;"],
          ["7600/7600", "Challenger >%%challenger-levels>;"],
          ["8650",      "Challenger 4;"],
        ],
        "%%iron-levels":        [["0","1;"],["100","2;"],["200","3;"],["300","4;"]],
        "%%bronze-levels":      [["0","1;"],["125","2;"],["250","3;"],["375","4;"]],
        "%%silver-levels":      [["0","1;"],["150","2;"],["300","3;"],["450","4;"]],
        "%%gold-levels":        [["0","1;"],["175","2;"],["350","3;"],["525","4;"]],
        "%%platinum-levels":    [["0","1;"],["200","2;"],["400","3;"],["600","4;"]],
        "%%emerald-levels":     [["0","1;"],["225","2;"],["450","3;"],["675","4;"]],
        "%%diamond-levels":     [["0","1;"],["250","2;"],["500","3;"],["750","4;"]],
        "%%master-levels":      [["0","1;"],["275","2;"],["550","3;"],["825","4;"]],
        "%%grandmaster-levels": [["0","1;"],["300","2;"],["600","3;"],["900","4;"]],
        "%%challenger-levels":  [["0","1;"],["350","2;"],["700","3;"]],
      },
    },
  },
};

const fmt = RuleBasedNumberFormat.fromCldrData(rankingData);

fmt.format(0);     // "Unranked"
fmt.format(400);   // "Iron 1"
fmt.format(550);   // "Iron 2"
fmt.format(925);   // "Bronze 2"
fmt.format(1450);  // "Silver 2"
fmt.format(2075);  // "Gold 2"
fmt.format(5300);  // "Master 1"
fmt.format(7950);  // "Challenger 2"
fmt.format(8649);  // "Challenger 3"
fmt.format(8650);  // "Challenger 4"
```

---

## Step 8 — Testing

Always validate rule boundaries. Here are the vitest tests that cover every tier and every sub-level transition:

```typescript
import { beforeAll, describe, expect, it } from "vitest";
import { RuleBasedNumberFormat } from "@pointnet/cldr-spellout";
import type { IRBNFData } from "@pointnet/cldr-spellout";

describe("Ranking system", () => {
  let fmt: RuleBasedNumberFormat;

  beforeAll(() => {
    const rankingData: IRBNFData = {
      rbnf: {
        identity: { language: "en" },
        rbnf: {
          RankingRules: {
            "%ranking": [
              ["0",         "Unranked;"],
              ["400/400",   "Iron >%%iron-levels>;"],
              ["800/800",   "Bronze >%%bronze-levels>;"],
              ["1300/1300", "Silver >%%silver-levels>;"],
              ["1900/1900", "Gold >%%gold-levels>;"],
              ["2600/2600", "Platinum >%%platinum-levels>;"],
              ["3400/3400", "Emerald >%%emerald-levels>;"],
              ["4300/4300", "Diamond >%%diamond-levels>;"],
              ["5300/5300", "Master >%%master-levels>;"],
              ["6400/6400", "Grandmaster >%%grandmaster-levels>;"],
              ["7600/7600", "Challenger >%%challenger-levels>;"],
              ["8650",      "Challenger 4;"],
            ],
            "%%iron-levels":        [["0","1;"],["100","2;"],["200","3;"],["300","4;"]],
            "%%bronze-levels":      [["0","1;"],["125","2;"],["250","3;"],["375","4;"]],
            "%%silver-levels":      [["0","1;"],["150","2;"],["300","3;"],["450","4;"]],
            "%%gold-levels":        [["0","1;"],["175","2;"],["350","3;"],["525","4;"]],
            "%%platinum-levels":    [["0","1;"],["200","2;"],["400","3;"],["600","4;"]],
            "%%emerald-levels":     [["0","1;"],["225","2;"],["450","3;"],["675","4;"]],
            "%%diamond-levels":     [["0","1;"],["250","2;"],["500","3;"],["750","4;"]],
            "%%master-levels":      [["0","1;"],["275","2;"],["550","3;"],["825","4;"]],
            "%%grandmaster-levels": [["0","1;"],["300","2;"],["600","3;"],["900","4;"]],
            "%%challenger-levels":  [["0","1;"],["350","2;"],["700","3;"]],
          },
        },
      },
    };
    fmt = RuleBasedNumberFormat.fromCldrData(rankingData);
  });

  it.each([
    // Unranked boundaries
    [0,    "Unranked"],
    [399,  "Unranked"],
    // Iron sub-levels (100 XP each)
    [400,  "Iron 1"],
    [499,  "Iron 1"],
    [500,  "Iron 2"],
    [599,  "Iron 2"],
    [600,  "Iron 3"],
    [699,  "Iron 3"],
    [700,  "Iron 4"],
    [799,  "Iron 4"],
    // Bronze sub-levels (125 XP each)
    [800,  "Bronze 1"],
    [924,  "Bronze 1"],
    [925,  "Bronze 2"],
    [1049, "Bronze 2"],
    [1050, "Bronze 3"],
    [1174, "Bronze 3"],
    [1175, "Bronze 4"],
    [1299, "Bronze 4"],
    // Silver sub-levels (150 XP each)
    [1300, "Silver 1"],
    [1449, "Silver 1"],
    [1450, "Silver 2"],
    [1749, "Silver 3"],
    [1750, "Silver 4"],
    [1899, "Silver 4"],
    // Gold sub-levels (175 XP each)
    [1900, "Gold 1"],
    [2074, "Gold 1"],
    [2075, "Gold 2"],
    [2599, "Gold 4"],
    // Platinum sub-levels (200 XP each)
    [2600, "Platinum 1"],
    [3399, "Platinum 4"],
    // Emerald sub-levels (225 XP each)
    [3400, "Emerald 1"],
    [4299, "Emerald 4"],
    // Diamond sub-levels (250 XP each)
    [4300, "Diamond 1"],
    [5299, "Diamond 4"],
    // Master sub-levels (275 XP each)
    [5300, "Master 1"],
    [6399, "Master 4"],
    // Grandmaster sub-levels (300 XP each)
    [6400, "Grandmaster 1"],
    [7599, "Grandmaster 4"],
    // Challenger sub-levels (350 XP each)
    [7600, "Challenger 1"],
    [7949, "Challenger 1"],
    [7950, "Challenger 2"],
    [8299, "Challenger 2"],
    [8300, "Challenger 3"],
    [8649, "Challenger 3"],
    // Challenger 4 catch-all
    [8650, "Challenger 4"],
    [9999, "Challenger 4"],
  ] as [number, string][])("format(%i) → %s", (xp, expected) => {
    expect(fmt.format(xp)).toBe(expected);
  });
});
```
