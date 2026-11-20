import { test } from "node:test";
import assert from "node:assert/strict";
import { linkEmail } from "./link-email.ts";

const event = { title: "Jets <vs> Bills", date: "2026-11-15", time: "13:00:00", end_time: null, place: "MetLife", address: "1 MetLife Stadium Dr", long_times: false };
const base = { event, names: "Hudson & Molly", parts: [], bringing: [], url: "https://chirk.fyi/x/r/abc/remember", calendarUrl: "https://chirk.fyi/x/calendar.ics" };

test("going: when, where, what they picked, their link and the calendar", () => {
  const e = linkEmail({ ...base, going: true, parts: ["Tailgate", "Game"], bringing: ["Chairs", "Ice"] });
  assert.equal(e.subject, "You're going: Jets <vs> Bills");
  assert.match(e.html, /Jets &lt;vs&gt; Bills/);
  assert.match(e.html, /Hudson &amp; Molly<\/strong>: You&#39;re going\./);
  assert.match(e.html, /href="https:\/\/www\.google\.com\/maps|href="https:\/\/maps\.apple\.com\/\?q=1%20MetLife/);
  assert.match(e.text, /^Jets <vs> Bills\nSunday, November 15 · 1 pm\nMetLife · 1 MetLife Stadium Dr\n\nHudson & Molly: You're going\.\nComing to: Tailgate and Game\nBringing: Chairs and Ice\n\nSee or change your reply: https:\/\/chirk\.fyi\/x\/r\/abc\/remember\nAdd to calendar: https:\/\/chirk\.fyi\/x\/calendar\.ics/);
});

test("can't make it, and a named guest who hasn't answered", () => {
  const no = linkEmail({ ...base, going: false, bringing: ["X"] });
  assert.equal(no.subject, "Your RSVP: Jets <vs> Bills");
  assert.doesNotMatch(no.text, /Bringing|calendar/);
  const later = linkEmail({ ...base, going: null });
  assert.match(later.text, /haven't replied yet\.\n\nRSVP: https/);
});

test("chirk.fyi/me at the bottom when given", () => {
  const e = linkEmail({ ...base, going: true, meUrl: "https://chirk.fyi/me" });
  assert.match(e.text, /\nEvery invite you get, in one place: https:\/\/chirk\.fyi\/me$/);
  assert.match(e.html, />chirk\.fyi\/me<\/a>/);
  assert.doesNotMatch(linkEmail({ ...base, going: true }).text, /Every invite you get/);
});
