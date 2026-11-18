// Accessibility pass over the guest flow (invite → RSVP → confirmation), no extra packages:
// tap targets, names, contrast, headings, keyboard order and focus rings, 320px reflow, reduced motion.
//   node scripts/a11y.mjs        (needs the local server and DATABASE_URL, like scripts/visual.mjs)
// Prints a report; exits 1 if anything fails. Inline links inside a sentence are reported but not failed (WCAG 2.5.8 exception).
import { createRequire } from "node:module";
import { GRAHAM, SAM, withFixtures } from "./fixtures.mjs";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
const ORIGIN = process.env.BASE_URL ?? "http://localhost:3000";

const screens = [
  ["invite (detailed)", "/visual-detailed"],
  ["invite (light)", "/visual-light"],
  ["RSVP", "/visual-detailed/rsvp", async (p) => p.click("text=Going")],
  ["confirmation", `/visual-detailed/r/${SAM}`],
  ["confirmation (changing)", `/visual-detailed/r/${GRAHAM}?change=1`],
];

// Runs in the page: everything we can measure without a screen reader.
function inspect() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const label = (el) => (el.getAttribute("aria-label") || (el.labels?.[0]?.textContent) || el.textContent || el.getAttribute("placeholder") || el.getAttribute("title") || "").replace(/\s+/g, " ").trim();
  const name = (el) => `${el.tagName.toLowerCase()} "${label(el).slice(0, 40)}"`;
  const out = { small: [], inline: [], unnamed: [], contrast: [], headings: [], h1: 0, lang: document.documentElement.lang, title: document.title };
  for (const el of document.querySelectorAll("a[href], button, summary, input:not([type=hidden]), textarea, select")) {
    if (!vis(el)) continue;
    const target = el.matches("input[type=checkbox], input[type=radio]") ? el.closest("label") ?? el : el;
    const r = target.getBoundingClientRect();
    const inSentence = el.tagName === "A" && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 2 && getComputedStyle(el).display === "inline";
    if (r.height < 44 || r.width < 24) (inSentence ? out.inline : out.small).push(`${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    if (!label(el)) out.unnamed.push(name(el));
  }
  // Contrast: each text node's color against the first opaque background behind it.
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const bg = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) return c.slice(0, 3); } return [255, 255, 255]; };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || !vis(el) || seen.has(el) || el.closest("[aria-hidden=true]")) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (el.matches("button:disabled, button:disabled *, [placeholder]")) continue; // disabled controls are exempt
    const fg = rgb(cs.color), opacity = parseFloat(cs.opacity) * [...Array(5)].reduce((o, _, i, __, p = el.parentElement) => o, 1);
    const L1 = lum(fg), L2 = lum(bg(el));
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio < need && opacity === 1) out.contrast.push(`"${n.textContent.trim().slice(0, 30)}" ${ratio.toFixed(2)}:1 (needs ${need}) at ${size}px`);
  }
  for (const h of document.querySelectorAll("h1, h2, h3")) if (vis(h)) out.headings.push(`${h.tagName} ${h.textContent.trim().slice(0, 40)}`);
  out.h1 = [...document.querySelectorAll("h1")].filter(vis).length;
  out.scrollX = document.documentElement.scrollWidth > document.documentElement.clientWidth;
  out.motion = [...document.querySelectorAll("*")].filter((e) => { const cs = getComputedStyle(e); return vis(e) && (parseFloat(cs.animationDuration) > 0 || (parseFloat(cs.transitionDuration) > 0.01 && cs.transitionProperty !== "none")); }).map(name).slice(0, 5);
  return out;
}

let failures = 0;
const fail = (line) => { failures++; console.log("  ✗ " + line); };
await withFixtures(async () => {
  const b = await chromium.launch();
  for (const [title, path, prep] of screens) {
    console.log(`\n${title}  ${path}`);
    for (const [vw, ctx] of [["390", { ...devices["iPhone 13"] }], ["320", { ...devices["iPhone 13"], viewport: { width: 320, height: 640 } }]]) {
      const p = await (await b.newContext({ ...ctx, reducedMotion: "reduce" })).newPage();
      await p.goto(ORIGIN + path);
      if (prep) await prep(p);
      const r = await p.evaluate(inspect);
      if (vw === "320") { if (r.scrollX) fail("320px: the page scrolls sideways"); else console.log("  ✓ 320px: no sideways scroll"); await p.context().close(); continue; }
      if (r.lang !== "en") fail(`<html lang> is "${r.lang}"`);
      if (!r.title) fail("no page title");
      if (r.h1 !== 1) fail(`${r.h1} h1 headings (want 1)`);
      console.log(`  headings: ${r.headings.join(" › ")}`);
      r.small.forEach((s) => fail(`tap target under 44px: ${s}`));
      r.inline.forEach((s) => console.log(`  · inline link (exempt): ${s}`));
      r.unnamed.forEach((s) => fail(`no accessible name: ${s}`));
      r.contrast.forEach((s) => fail(`contrast: ${s}`));
      r.motion.forEach((s) => fail(`moves with reduced motion on: ${s}`));
      // Keyboard: Tab through everything; each stop must be visible and show a ring (outline or box-shadow).
      const stops = [];
      for (let i = 0; i < 40; i++) {
        await p.keyboard.press("Tab");
        const f = await p.evaluate(() => {
          const el = document.activeElement; if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          // A field shows focus by changing its border: compare with how it looks unfocused.
          const focusedBorder = cs.borderColor;
          el.blur(); const restBorder = getComputedStyle(el).borderColor; el.focus({ focusVisible: true });
          const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none" || focusedBorder !== restBorder;
          return { what: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 28)}"`, ring, field: el.matches("input, textarea, select") };
        });
        if (!f || stops.some((s) => s.what === f.what && stops.length > 2 && s === stops[0])) break;
        if (stops.length && f.what === stops[0].what) break;
        stops.push(f);
      }
      console.log(`  keyboard: ${stops.length} stops: ${stops.map((s) => s.what).join(" → ")}`);
      stops.filter((s) => !s.ring).forEach((s) => fail(`no visible focus: ${s.what}`));
      await p.context().close();
    }
  }
  await b.close();
});
console.log(failures ? `\n${failures} issue${failures === 1 ? "" : "s"} found.` : "\nNo issues found ✓");
process.exit(failures ? 1 : 0);
