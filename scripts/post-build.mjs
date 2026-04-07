import { readFileSync, writeFileSync } from "fs";

writeFileSync("dist/cjs/package.json", JSON.stringify({ type: "commonjs" }, null, 2) + "\n");

// Node.js v24+ requires `with { type: "json" }` for JSON imports in ESM.
// TypeScript's module:"ES2020" doesn't support import attributes in source,
// so we patch the compiled ESM output instead.
const localeDataPath = "dist/esm/localeData.js";
const patched = readFileSync(localeDataPath, "utf8").replace(
  /from ("cldr-rbnf\/rbnf\/[^"]+\.json");/g,
  'from $1 with { type: "json" };',
);
writeFileSync(localeDataPath, patched);
