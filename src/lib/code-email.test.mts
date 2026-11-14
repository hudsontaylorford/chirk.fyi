import { test } from "node:test";
import assert from "node:assert/strict";
import { codeEmail, cohostEmail } from "./code-email.ts";

test("code and co-host emails", () => {
  const c = codeEmail("042917");
  assert.equal(c.subject, "Your chirk code: 042917");
  assert.match(c.text, /^Your chirk sign-in code is 042917\. It works for 10 minutes\./);
  const h = cohostEmail({ by: "Hudson & Molly", title: "Thanksgiving <2026>", url: "https://chirk.fyi/host?email=m%40x.com" });
  assert.equal(h.subject, "Hudson & Molly added you as a host: Thanksgiving <2026>");
  assert.match(h.html, /<strong>Hudson &amp; Molly<\/strong> added you as a co-host of <strong>Thanksgiving &lt;2026&gt;<\/strong>/);
  assert.match(h.html, /href="https:\/\/chirk\.fyi\/host\?email=m%40x\.com"/);
});
