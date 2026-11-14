import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGuests, reminderText } from "./guests.ts";

test("names, couples and emails from the Add guests box", () => {
  assert.deepEqual(parseGuests("Sam, Graham & Ellen graham@X.com\nPriya and Dev <priya@y.org>,  ,Lee"), [
    { names: ["Sam"], email: null },
    { names: ["Graham", "Ellen"], email: "graham@x.com" },
    { names: ["Priya", "Dev"], email: "priya@y.org" },
    { names: ["Lee"], email: null },
  ]);
  assert.deepEqual(parseGuests("Andrea sandy@z.com"), [{ names: ["Andrea"], email: "sandy@z.com" }]); // "and" inside a name stays
  assert.deepEqual(parseGuests(""), []);
});

test("reminder wording", () => {
  assert.equal(
    reminderText({ title: "Thanksgiving 2026", date: "2026-11-26", rsvp_by: "2026-11-19" }, "Sam", "https://chirk.fyi/t/r/abc/remember?to=invite"),
    "Hi Sam! Can you make Thanksgiving 2026 on Thursday, November 26? Let us know here by Thu, Nov 19: https://chirk.fyi/t/r/abc/remember?to=invite",
  );
});
