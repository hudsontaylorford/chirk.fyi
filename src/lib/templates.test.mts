import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATE_FIELDS, TEMPLATES, fromEvent, template } from "./templates.ts";

// Every setting a template fills in must be one the event form has a field for, or it would silently do nothing.
const FORM = new Set<string>(TEMPLATE_FIELDS);

test("templates: unique, findable, and only fill in fields the form has", () => {
  assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, TEMPLATES.length);
  assert.equal(new Set(TEMPLATES.map((t) => t.label)).size, TEMPLATES.length);
  for (const t of TEMPLATES) {
    assert.equal(template(t.id), t);
    for (const k of Object.keys(t.set)) assert.ok(FORM.has(k), `${t.id} sets ${k}`);
  }
  assert.equal(template("nope"), undefined);
  assert.equal(template(undefined), undefined);
});

test("saving an event as a template keeps settings and wording, never its title, dates or guests", () => {
  const kept = fromEvent({ id: "x", slug: "poker", title: "Poker", date: "2026-12-12", rsvp_by: "2026-12-10", gift_draw_on: "2026-12-01", time: "20:00:00", poker_on: true, max_guests: 0, details: "Bring cash", status: "live" });
  assert.deepEqual(kept, { time: "20:00:00", poker_on: true, max_guests: 0, details: "Bring cash" });
});
