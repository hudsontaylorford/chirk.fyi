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
