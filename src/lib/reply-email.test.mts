import { test } from "node:test";
import assert from "node:assert/strict";
import { replyEmail } from "./reply-email.ts";

const base = {
  title: "Thanksgiving", date: "2026-11-26", names: "Sally & Bo", adults: 2, kids: 0, parts: [], bringing: ["Pie"], bringOn: true,
  note: "Nut allergy", changed: false, coming: 14, waiting: 6, hostUrl: "https://chirk.fyi/t/host",
};

test("going: what they said, then the tally", () => {
  const e = replyEmail({ ...base, going: true, kids: 1, parts: ["Dinner", "Dessert"] });
  assert.equal(e.subject, "Sally & Bo are going: Thanksgiving");
  assert.match(e.text, /Thanksgiving · Thu, Nov 26\n\nPlus 1 kid\nComing to: Dinner and Dessert\nBringing: Pie\nNote: "Nut allergy"\n\nThat's 14 coming so far, and 6 invites haven't replied yet\./);
  assert.match(e.html, /Sally &amp; Bo are going/);
  assert.doesNotMatch(e.text, /adult/); // head counts only matter with kids
});

test("a bare reply still says something", () => {
  const e = replyEmail({ ...base, names: "Hans", adults: 1, going: true, bringing: [], note: null, waiting: 1 });
  assert.equal(e.subject, "Hans is going: Thanksgiving");
  assert.match(e.text, /Not bringing anything yet\n\nThat's 14 coming so far, and 1 invite hasn't replied yet\./);
  assert.doesNotMatch(replyEmail({ ...base, going: true, bringOn: false, waiting: 0 }).text, /Bringing|replied yet/);
});

test("can't make it, and changed replies", () => {
  assert.equal(replyEmail({ ...base, going: false }).subject, "Sally & Bo can't make it: Thanksgiving");
  assert.doesNotMatch(replyEmail({ ...base, going: false }).text, /Bringing/);
  assert.equal(replyEmail({ ...base, going: true, changed: true }).subject, "Sally & Bo updated: going: Thanksgiving");
});
