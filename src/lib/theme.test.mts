import { test } from "node:test";
import assert from "node:assert/strict";
import { contrast, hslLuminance, mainColor, themeTokens } from "./theme.ts";

const pixels = (...colors: [number, number, number, number][]) => colors.flatMap(([r, g, b, n]) => Array.from({ length: n }, () => [r, g, b, 255]).flat());

test("main color: the strongest hue wins over gray, white and a little of another hue", () => {
  assert.equal(mainColor(pixels([128, 30, 40, 50], [250, 250, 250, 300], [120, 120, 120, 100], [30, 90, 200, 10])), "#801e28");
});

test("a gray photo has no color", () => {
  assert.equal(mainColor(pixels([200, 200, 200, 100], [20, 20, 20, 100])), null);
});

// WCAG contrast of the theme's gray text on its paper, for any hue.
const lum = (hslText: string) => {
  const [h, s, l] = hslText.match(/[\d.]+/g)!.map(Number);
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => { const k = (n + h / 30) % 12; const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(0) + 0.7152 * f(8) + 0.0722 * f(4);
};
test("gray text stays readable on the paper (4.5:1) for every hue", () => {
  for (const hex of ["#ff0000", "#ffee00", "#00ff66", "#00ccff", "#2200ff", "#ff00aa", "#806040"]) {
    const t = themeTokens(hex);
    const ratio = (lum(t.paper) + 0.05) / (lum(t.soft) + 0.05);
    assert.ok(ratio >= 4.5, `${hex}: ${ratio.toFixed(2)}`);
  }
});

test("the RSVP button's text reads on its deep shade (4.5:1) for every hue", () => {
  for (const hex of ["#ff0000", "#ffee00", "#00ff66", "#00ccff", "#2200ff", "#ff00aa", "#806040", "#5c4049"]) {
    const t = themeTokens(hex);
    const [h, s, l] = t.accent.match(/[\d.]+/g)!.map(Number);
    const on = t.onAccent === "#ffffff" ? 1 : hslLuminance(30, 10, 10);
    const ratio = contrast(hslLuminance(h, s / 100, l / 100), on);
    assert.ok(ratio >= 4.5, `${hex}: ${ratio.toFixed(2)}`);
  }
});
