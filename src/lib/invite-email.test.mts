import { test } from "node:test";
import assert from "node:assert/strict";
import { inviteEmail } from "./invite-email.ts";

const event = {
  title: "Jets <vs> Bills", date: "2026-11-15", time: "07:45:00", end_time: null, place: "MetLife", address: "1 MetLife Stadium Dr",
  details: "# Bag policy\n- **Clear** bags only\nSee https://example.com/bags", rsvp_by: null, cover_url: null,
};

test("subject, escaped title, RSVP button and formatted details", () => {
  const { subject, html, text } = inviteEmail(event, "https://chirk.fyi/jets-vs-bills");
  assert.equal(subject, "You're invited: Jets <vs> Bills");
  assert.match(html, /Jets &lt;vs&gt; Bills/);
  assert.match(html, /href="https:\/\/chirk\.fyi\/jets-vs-bills"[^>]*>RSVP<\/a>/);
  assert.match(html, /font-weight:700;">Bag policy</);
  assert.match(html, /&bull;&nbsp; <strong>Clear<\/strong> bags only/);
  assert.match(html, /<a href="https:\/\/example\.com\/bags"/);
  assert.match(text, /Sunday, November 15 · 7:45 am\nMetLife · 1 MetLife Stadium Dr\n\nBag policy\n- Clear bags only/);
  assert.match(text, /RSVP: https:\/\/chirk\.fyi\/jets-vs-bills/);
});
