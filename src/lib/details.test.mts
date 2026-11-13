import { test } from "node:test";
import assert from "node:assert/strict";
import { inline, parseDetails } from "./details.ts";

test("explicit headings and bullets; nothing guessed", () => {
  assert.deepEqual(parseDetails("Intro line.\n\n# Bag policy\n•\tClear bags only.\n- No umbrellas.\n\nTickets: $163 each\nKickoff: 1:00 PM"), [
    [{ kind: "text", text: "Intro line." }],
    [{ kind: "heading", text: "Bag policy" }, { kind: "bullet", text: "Clear bags only." }, { kind: "bullet", text: "No umbrellas." }],
    [{ kind: "text", text: "Tickets: $163 each" }, { kind: "text", text: "Kickoff: 1:00 PM" }],
  ]);
});

test("two bullets pasted onto one line split apart", () => {
  const [b] = parseDetails("# Parking\n•\tGold Lot L\t•\tIf driving, grab a pass.");
  assert.deepEqual(b.map((l) => l.kind + ":" + l.text), ["heading:Parking", "bullet:Gold Lot L", "bullet:If driving, grab a pass."]);
});

test("bold and links", () => {
  assert.deepEqual(inline("**Tickets:** $163, see https://example.com/x/"), [
    { bold: true, text: "Tickets:" }, { text: " $163, see " }, { href: "https://example.com/x/", text: "example.com/x" },
  ]);
});

test("auto-format writes explicit marks and is stable when run twice", async () => {
  const { autoFormat } = await import("./details.ts");
  const pasted = "Intro line.\n\nTickets: Purchased\nKickoff: 1:00 PM\n\nBag policy\n•\tClear bags only.\t•\tNo umbrellas.\n\nSee you there";
  const once = autoFormat(pasted);
  assert.equal(once, "Intro line.\n\n**Tickets:** Purchased\n**Kickoff:** 1:00 PM\n\n# Bag policy\n- Clear bags only.\n- No umbrellas.\n\nSee you there");
  assert.equal(autoFormat(once), once);
});
