import { test } from "node:test";
import assert from "node:assert/strict";
import { giftEmail } from "./gift-email.ts";

test("gift match email", () => {
  const e = giftEmail({ title: "Friendsgiving", giver: "Graham & Ellen", receiver: "Sam <3", budget: "$30", wish: "Books", url: "https://chirk.fyi/f/r/abc/remember?to=invite" });
  assert.equal(e.subject, "Your gift exchange match: Friendsgiving");
  assert.match(e.text, /^Hi Graham & Ellen,\n\nFor Friendsgiving, you're giving a gift to Sam <3\. Keep it a secret!\nBudget: \$30\nTheir ideas: Books\n\nSee it any time: https/);
  assert.match(e.html, /font-weight:700;">Sam &lt;3<\/p>/);
  assert.doesNotMatch(giftEmail({ title: "T", giver: "A", receiver: "B", budget: null, wish: null, url: "u" }).text, /Budget|ideas/);
});
