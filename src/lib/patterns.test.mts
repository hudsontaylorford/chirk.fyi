import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The frozen v2 patterns (docs/CHIRK_UI_PATTERNS.md): guest screens use only button / button-quiet / link / tap / choice / field,
// so the old look (pills, filled boxes, ad-hoc colors) can't drift back in unnoticed.
const GUEST = [
  "src/components/EventView.tsx",
  "src/components/RsvpForm.tsx",
  "src/components/RsvpButton.tsx",
  "src/components/EmailMyLink.tsx",
  "src/app/[slug]/page.tsx",
  "src/app/[slug]/rsvp/page.tsx",
  "src/app/[slug]/r/[token]/page.tsx",
];
const OLD = [
  [/\bbtn(-quiet)?\b/, "old button (use button / button-quiet / link)"],
  [/["\s`]pill(-check)?\b/, "pill (use choice)"],
  [/rounded-full|rounded-2xl/, "pill/box corners (8px: rounded-lg)"],
  [/bg-wash/, "filled box (use space and hairlines)"],
  [/#[0-9a-fA-F]{3,8}\b|\bblue\b|text-(sky|indigo|blue)-/, "a color outside the tokens"],
] as const;

test("guest screens use only the frozen v2 patterns", () => {
  const files: [string, string][] = GUEST.map((f) => [f, readFileSync(f, "utf8")]);
  // KeepLink lives beside a host helper; check just the guest part.
  const link = readFileSync("src/components/YourLink.tsx", "utf8");
  files.push(["src/components/YourLink.tsx (KeepLink)", link.slice(link.indexOf("export function KeepLink"), link.indexOf("export function CopyLink"))]);
  for (const [file, text] of files) {
    const code = text.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, ""); // comments may mention old names
    for (const [pattern, why] of OLD) assert.doesNotMatch(code, pattern, `${file}: ${why}`);
  }
});

test("the accent stays one value, and no surface uses it", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /--color-accent: #1c1917;/, "accent is ink until a brand color is chosen");
  const v2 = css.slice(css.indexOf("chirk v2"));
  assert.doesNotMatch(v2, /background(-color)?:\s*var\(--color-accent\)/, "accent is never a fill in v2");
});
