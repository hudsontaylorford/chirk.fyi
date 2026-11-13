import { test } from "node:test";
import assert from "node:assert/strict";
import { replyEmail } from "./reply-email.ts";

const base = { title: "Thanksgiving", names: "Sally & Bo", adults: 2, kids: 1, bringing: ["Pie"], note: "Nut allergy", changed: false, hostUrl: "https://chirk.fyi/t/host" };

test("going: subject, party, bringing, note, escaped", () => {
  const e = replyEmail({ ...base, going: true });
  assert.equal(e.subject, "Sally & Bo is going: Thanksgiving");
  assert.match(e.text, /2 adults, 1 kid\nBringing: Pie\nNote: "Nut allergy"/);
  assert.match(e.html, /Sally &amp; Bo is going/);
});

test("can't make it, and changed replies", () => {
  assert.equal(replyEmail({ ...base, going: false }).subject, "Sally & Bo can't make it: Thanksgiving");
  assert.doesNotMatch(replyEmail({ ...base, going: false }).text, /Bringing|adults/);
  assert.equal(replyEmail({ ...base, going: true, changed: true }).subject, "Sally & Bo updated: going: Thanksgiving");
});
