import { test } from "node:test";
import assert from "node:assert/strict";
import { linkEmail } from "./link-email.ts";

test("link email: escaped, status, bringing and the private link", () => {
  const e = linkEmail({ title: "Jets <vs> Bills", names: "Hudson & Molly", going: true, bringing: ["Chairs"], url: "https://chirk.fyi/x/r/abc/remember" });
  assert.equal(e.subject, "Your RSVP: Jets <vs> Bills");
  assert.match(e.html, /Jets &lt;vs&gt; Bills/);
  assert.match(e.html, /Hudson &amp; Molly<\/strong>: You&#39;re going\./);
  assert.match(e.html, /href="https:\/\/chirk\.fyi\/x\/r\/abc\/remember"/);
  assert.match(e.text, /Bringing: Chairs\n\nSee or change your reply: https:\/\/chirk\.fyi\/x\/r\/abc\/remember/);
  assert.doesNotMatch(linkEmail({ title: "T", names: "A", going: false, bringing: ["X"], url: "u" }).text, /Bringing/);
});
