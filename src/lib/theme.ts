// An invite's color, matched to its cover photo: the photo's main hue, as a pale paper behind the invite. Pure.
// Text stays ink and buttons stay ink; only the paper, gray text and hairlines take the hue, so it's always readable.

/** The photo's main color from its pixels (RGBA, e.g. a 24×24 canvas): the strongest hue among the colorful pixels. "#rrggbb", or null for a gray photo. */
export function mainColor(px: ArrayLike<number>): string | null {
  const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i + 3 < px.length; i += 4) {
    const [h, s, l] = hsl(px[i], px[i + 1], px[i + 2]);
    if (px[i + 3] < 128 || s < 0.15 || l < 0.12 || l > 0.9) continue; // skip see-through, gray, near-black and near-white
    const bin = bins[Math.floor(h / 30) % 12];
    bin.w += s; bin.r += px[i] * s; bin.g += px[i + 1] * s; bin.b += px[i + 2] * s;
  }
  const top = bins.reduce((a, b) => (b.w > a.w ? b : a));
  if (top.w < 2) return null; // too few colorful pixels: the plain look suits it better
  return "#" + [top.r, top.g, top.b].map((c) => Math.round(c / top.w).toString(16).padStart(2, "0")).join("");
}

/** A second choice that stands apart: among the photo's clearly colorful hues at least 60° from the main one,
 *  the one with the most pixels × distance² (so a red or blue in a green-brown photo). "#rrggbb", or null when there's none. */
export function accentColor(px: ArrayLike<number>, main: string): string | null {
  const [mh] = hsl(parseInt(main.slice(1, 3), 16), parseInt(main.slice(3, 5), 16), parseInt(main.slice(5, 7), 16));
  const bins = Array.from({ length: 12 }, () => ({ n: 0, w: 0, r: 0, g: 0, b: 0, d: 0 }));
  for (let i = 0; i + 3 < px.length; i += 4) {
    const [h, s, l] = hsl(px[i], px[i + 1], px[i + 2]);
    if (px[i + 3] < 128 || s < 0.3 || l < 0.2 || l > 0.85) continue; // only clearly colorful pixels
    const d = Math.min(Math.abs(h - mh), 360 - Math.abs(h - mh));
    if (d < 60) continue;
    const bin = bins[Math.floor(h / 30) % 12];
    bin.n++; bin.d += d; bin.w += s; bin.r += px[i] * s; bin.g += px[i + 1] * s; bin.b += px[i + 2] * s;
  }
  const score = (b: { n: number; d: number }) => (b.n ? b.n * (b.d / b.n) ** 2 : 0);
  const top = bins.reduce((a, b) => (score(b) > score(a) ? b : a));
  if (top.n < px.length / 4 / 200) return null; // under 0.5% of the photo: stray pixels, not a color of it
  return "#" + [top.r, top.g, top.b].map((c) => Math.round(c / top.w).toString(16).padStart(2, "0")).join("");
}

/** The page tokens for that color: pale paper, a darker gray in the same hue, matching hairlines,
 *  and a deep shade for the RSVP button and picked choices, with black or white text, whichever reads better. */
export function themeTokens(hex: string) {
  const [h, s] = hsl(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
  const sat = Math.round(Math.min(s, 0.6) * 100);
  const deep: [number, number, number] = [h, Math.min(s, 0.65), 0.36];
  const ink = luminance(28, 25, 23); // --color-ink
  const onWhite = contrast(luminance(...rgb(...deep)), 1), onInk = contrast(luminance(...rgb(...deep)), ink);
  return {
    accent: `hsl(${Math.round(h)} ${Math.round(deep[1] * 100)}% 36%)`,
    onAccent: onWhite >= onInk ? "#ffffff" : "#1c1917",
    paper: `hsl(${Math.round(h)} ${sat}% 94%)`,
    soft: `hsl(${Math.round(h)} ${Math.round(sat / 3)}% 34%)`, // ≥ 4.5:1 on the paper
    line: `hsl(${Math.round(h)} ${Math.round(sat / 2)}% 82%)`,
  };
}

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

function hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function rgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}
const luminance = (r: number, g: number, b: number) =>
  [r, g, b].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
/** WCAG contrast between two luminances. */
export const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
export const hslLuminance = (h: number, s: number, l: number) => luminance(...rgb(h, s, l));
