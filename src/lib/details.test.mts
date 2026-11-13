import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDetails } from "./details.ts";

test("headings, bullets, plain lines and blank-line blocks", () => {
  const blocks = parseDetails("Intro line.\n\nBag policy\n•\tClear bags only.\n- No umbrellas.\n\nTickets: $163 each\nKickoff: 1:00 PM");
  assert.deepEqual(blocks, [
    { lines: [{ bullet: false, text: "Intro line." }] },
    { heading: "Bag policy", lines: [{ bullet: true, text: "Clear bags only." }, { bullet: true, text: "No umbrellas." }] },
    { lines: [{ bullet: false, text: "Tickets: $163 each" }, { bullet: false, text: "Kickoff: 1:00 PM" }] },
  ]);
});

test("two bullets pasted onto one line split apart", () => {
  const [b] = parseDetails("Parking\n•\tGold Lot L\t•\tIf driving, grab a pass.");
  assert.deepEqual(b.lines.map((l) => l.text), ["Gold Lot L", "If driving, grab a pass."]);
});

test("a single short line stays a line, not a heading", () => {
  assert.deepEqual(parseDetails("See you there"), [{ lines: [{ bullet: false, text: "See you there" }] }]);
});
