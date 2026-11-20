import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

// The frozen patterns (docs/CHIRK_UI_PATTERNS.md): every screen, guest and host, uses only button / button-quiet / link / tap /
// choice / choice-check / field, so the old look (pills, filled boxes, ad-hoc colors) can't drift back in unnoticed.
// The share-preview image and the page shell need literal colors, so they're left out.
const SKIP = ["src/app/[slug]/og/route.tsx", "src/app/layout.tsx"];
const SCREENS = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((f) => `src/${f}`).filter((f) => f.endsWith(".tsx") && !SKIP.includes(f));
const OLD = [
  [/\bbtn(-quiet)?\b/, "old button (use button / button-quiet / link)"],
  [/["\s`]pill(-check)?\b/, "pill (use choice)"],
  [/rounded-full|rounded-2xl/, "pill/box corners (8px: rounded-lg)"],
  [/bg-wash/, "filled box (use space and hairlines)"],
  [/#[0-9a-fA-F]{3,8}\b|\bblue\b|text-(sky|indigo|blue)-/, "a color outside the tokens"],
] as const;

test("every screen uses only the frozen patterns", () => {
  assert.ok(SCREENS.length > 40, "found the screens");
  for (const file of SCREENS) {
    const code = readFileSync(file, "utf8").replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ""); // comments may mention old names
    for (const [pattern, why] of OLD) assert.doesNotMatch(code, pattern, `${file}: ${why}`);
  }
});

test("the accent stays one value, and no surface uses it", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /--color-accent: #3d5a99;/, "the accent is slate blue (changing it needs Hudson's OK)");
  const v2 = css.slice(css.indexOf("chirk v1 patterns"));
  assert.doesNotMatch(v2, /background(-color)?:\s*var\(--color-accent\)/, "accent is never a fill");
});
