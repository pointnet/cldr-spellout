When creating or updating any TypeScript file, write code that already matches the project's Prettier config — do not rely on a format pass to fix it.

Current `.prettierrc`:
- `printWidth: 100`
- `semi: true`
- `singleQuote: false` — use double quotes
- `quoteProps: "as-needed"`
- `trailingComma: "all"`
- `bracketSpacing: true`
- `objectWrap: "collapse"`
- `arrowParens: "avoid"` — omit parens for single-param arrow functions: `x => x` not `(x) => x`
