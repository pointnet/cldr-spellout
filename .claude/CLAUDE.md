# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@pointnet/cldr-spellout` is a TypeScript implementation of ICU Rule-Based Number Formatting (RBNF). It converts numbers to words (e.g., 123 → "one hundred twenty-three") across locales, using CLDR spellout rules via the `cldr-rbnf` npm package.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Delete dist/, compile to dist/esm/ (ES modules) and dist/cjs/ (CommonJS)
npm test             # Run all tests (vitest)
npm run coverage     # Run tests with v8 coverage
npm run lint         # Run ESLint
npm run format       # Auto-format with Prettier
npm run format:check # Check formatting (CI)
```

Tests run directly on source via vitest's native TS support — no build step needed for testing.
Build uses two tsconfigs: `tsconfig.esm.json` → `dist/esm/`, `tsconfig.cjs.json` → `dist/cjs/`.

**Docs site** (independent package in `docs/`):
```bash
npm run build                    # Must run first — docs depends on dist/ via "file:.."
npm run docs                     # Start Docusaurus dev server (localhost:3000)
cd docs && npm install           # Install Docusaurus dependencies (first time only)
cd docs && npm run build         # Production build → docs/build/
```

`GTAG_ID` env var injects Google Analytics into the Docusaurus build. Unset = no analytics. In CI it comes from the `GTAG_ID` repository secret.

## Architecture

```
src/
  index.ts                   # Public entry point — exports RuleBasedNumberFormat + IRBNFData
  localeData.ts              # Static imports of all 89 cldr-rbnf locale JSONs (auto-generated)
  RuleBasedNumberFormat.ts   # Main class: fromLocale(), fromCldrData(), format(), parse()
  NFRuleSet.ts               # Rule set (collection of rules for one locale/type)
  NFRule.ts                  # Single rule: parses descriptor, holds substitutions
  NFSubstitution.ts          # Abstract base for substitutions
  types.ts                   # Interfaces (INFRule, INFRuleSet, IFormatter, ...)
  substitutions/             # Concrete substitution types
    MultiplierSubstitution   # << : floor(n / divisor)
    ModulusSubstitution      # >> : n % divisor
    SameValueSubstitution    # == : n unchanged (delegates to rule set or DecimalFormat)
    FractionalPartSubstitution  # handles x.x / 0.x rules, by-digits or named rule set
    NumeratorSubstitution    # for fraction rule sets
    AbsoluteValueSubstitution, IntegralPartSubstitution
  util/
    convertArrows.ts         # Unicode ← → − to ASCII < > -
    makeSubstitution.ts      # Factory: picks substitution class from token char
    pow, lcm, expectedExponent, numberFormat, pluralFormat

scripts/
  post-build.mjs             # (1) Writes dist/cjs/package.json → {"type":"commonjs"}
                             # (2) Patches dist/esm/localeData.js to add `with { type: "json" }`
                             #     on all JSON imports (required by Node.js v24 ESM)

docs/                        # Docusaurus site — docs + live playground
  package.json               # Independent package; @pointnet/cldr-spellout via "file:.."
  docusaurus.config.ts       # url: pointnet.github.io, baseUrl: /cldr-spellout/
                             # webpack alias forces CJS build (avoids `with { type: "json" }` issue)
  docs/                      # Markdown pages (getting-started, api-reference, ...)
  src/pages/                 # index.tsx (landing), playground.tsx
  src/components/Playground/ # Live playground React component

.github/workflows/
  deploy-docs.yml            # Builds library then Docusaurus, deploys to GitHub Pages on push to main
  publish.yml                # Publishes to npm + creates GitHub Release on v*.*.* tag push

tests/
  util/                      # Unit tests for utility functions
  format/                    # Locale tests (english, french, german, spanish, ...)
  format-features/           # Feature tests (fractions, negatives, rounding, ...)
  parse/                     # Parse and round-trip tests
  integration/               # API surface, cldr-data loading
```

## Reference Repository

The ICU C++ source is cloned at `.reference/icu` (git-ignored). It is the authoritative reference for RBNF behaviour — particularly `icu4c/source/i18n/nfrule.cpp`, `nfrset.cpp`, `nfsubs.cpp`, and `itrbnf.cpp` (test cases).

Keep it up to date: `git -C .reference/icu pull`.

## Key Gotchas

**Unicode arrows in CLDR data**
CLDR JSON uses Unicode arrows (`←`, `→`, `−`). `convertArrows` must run before parsing. Some locales (e.g. Polish) use three arrows (`←%ruleset←←`) — do not collapse them.

**Fraction rule sets**
Rule sets used as the target of a named `FractionalPartSubstitution` (`>%%frac>`) must be marked with `makeIntoFractionRuleSet()`, otherwise `findNormalRule()` is used instead of `findFractionRuleSetRule()` (LCM-based denominator matching) and output is empty.

**Rule descriptor radix**
`60/60:` sets base value 60 and radix 60, so divisor = 60¹ = 60. Without the `/60`, radix defaults to 10 and divisor = 10 — producing wrong output for time/duration rules.

**Floating-point precision**
Use `String(Math.abs(number))` to get the fractional digits of a decimal — not `toFixed(20)`, which exposes IEEE 754 noise (e.g. `0.001.toFixed(20)` → `"0.00100000000000000002"`).

**Dual CJS/ESM package marker**
Root `package.json` has `"type": "module"` (ESM). The build script runs `scripts/post-build.mjs` which writes `dist/cjs/package.json` → `{"type": "commonjs"}` so Node.js treats the CJS output correctly. If you wipe `dist/` manually and forget to rebuild, this file won't exist and `require()` will break.

**x.x vs x,x rule priority**
If both `x.x:` and `x,x:` rules exist in the same rule set, the last one registered wins. Keep only the rule matching the intended decimal separator.

**Relative imports use `.js` extensions**
All `import … from "./Foo.js"` in source use `.js` extensions, not `.ts`.
TypeScript (`moduleResolution: "bundler"`) resolves `.js` → `.ts` at compile time and preserves
the extension in ESM output, satisfying Node's strict ESM module resolver.
Do not remove these extensions or strip them to bare imports.

**JSON import attributes (Node.js v24 ESM)**
Node.js v24+ requires `with { type: "json" }` for JSON imports in ESM.
TypeScript `module:"ES2020"` can't emit these from source, so `scripts/post-build.mjs`
patches `dist/esm/localeData.js` after compilation. The source stays clean.

**docs/ lockfile and `file:..` drift**
`docs/package.json` depends on the library via `file:..`. Any change to the parent's `package.json`
(version, dependencies, engines, etc.) invalidates the `file:` snapshot inside `docs/package-lock.json`.
This is why `deploy-docs.yml` uses `npm install` (not `npm ci`) for both install steps — `npm install`
re-resolves the `file:` dep against the current parent and tolerates the drift. After a parent
`package.json` change, run `cd docs && npm install` locally and commit the updated lockfile to keep
it in sync.

**IRBNFData rule body semicolons**
Every body string in a `[descriptor, body]` tuple must end with `;`.
`fromCldrData` joins all rule sets into one string and the parser splits on `;%` boundaries —
the `;` at the end of the last rule in a set followed by the `%` of the next set's name.
Omitting semicolons causes all rule sets to collapse into one, making private `%%` sets invisible.
