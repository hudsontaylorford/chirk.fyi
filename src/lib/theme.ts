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

/** The page tokens for that color: pale paper, a darker gray in the same hue, matching hairlines. */
export function themeTokens(hex: string) {
  const [h, s] = hsl(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
  const sat = Math.round(Math.min(s, 0.6) * 100);
  return {
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
