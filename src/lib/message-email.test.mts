import { test } from "node:test";
import assert from "node:assert/strict";
import { messageEmail } from "./message-email.ts";

const e = {
  title: "Thanksgiving", date: "2026-11-26", time: "15:00:00", end_time: null, place: "The Fords'", address: "718 Greene Ave",
  schedule: "10am Bagels\n3pm Dinner", hosted_by: "Hudson & Molly", long_times: false,
};

test("a note from the hosts, with the details when asked", () => {
  const m = messageEmail(e, "Sam", "Ring the top bell.\n\nSee you <soon>!", "https://chirk.fyi/t/r/abc/remember?to=invite", true);
  assert.equal(m.subject, "Thanksgiving: a note from Hudson & Molly");
  assert.match(m.html, /Hi Sam,<\/p>\n<p[^>]*>Ring the top bell\.<\/p><p[^>]*>See you &lt;soon&gt;!<\/p>/);
  assert.match(m.html, /— Hudson &amp; Molly/);
  assert.match(m.html, /Thursday, November 26 · 3 pm/);
  assert.match(m.html, /font-weight:700;">3 pm&nbsp;&nbsp;Dinner/);
  assert.match(m.text, /^Hi Sam,\n\nRing the top bell\.\n\nSee you <soon>!\n\n— Hudson & Molly\n\nThanksgiving\nThursday, November 26 · 3 pm\nThe Fords' · 718 Greene Ave\n10 am  Bagels\n3 pm  Dinner\n\nSee the invite: https/);
});

test("without details or hosts", () => {
  const m = messageEmail({ ...e, hosted_by: null }, "Sam", "Running late!", "https://x", false);
  assert.equal(m.subject, "A note about Thanksgiving");
  assert.doesNotMatch(m.html, /November 26/);
  assert.equal(m.text, "Hi Sam,\n\nRunning late!\n\nSee the invite: https://x");
});
