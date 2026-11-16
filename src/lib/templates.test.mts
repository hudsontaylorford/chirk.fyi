import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, template } from "./templates.ts";

// Every setting a template fills in must be one the event form has a field for, or it would silently do nothing.
const FORM = new Set([
  "details", "schedule", "bring_prompt", "allow_own", "allow_doubles", "ask_arrival", "long_times", "rsvp_by", "remind_replies",
  "note_prompt", "note_hint", "notes_public", "max_guests", "ask_kids", "notify_host", "costs_on", "poker_on",
  "gift_on", "gift_budget", "gift_rules", "gift_draw_on", "gift_remind_ideas", "gift_remind_givers",
]);

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
