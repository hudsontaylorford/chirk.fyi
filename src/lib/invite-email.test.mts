import { test } from "node:test";
import assert from "node:assert/strict";
import { inviteEmail, reminderEmail } from "./invite-email.ts";

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

test("the schedule and the hosts' signature come along", () => {
  const { html, text } = inviteEmail(
    { ...event, time: "15:00:00", schedule: "10am Bagels\n3pm Dinner", hosted_by: "Hudson & Molly", long_times: true },
    "https://chirk.fyi/t",
  );
  assert.match(html, /10:00 AM<\/span>&nbsp;&nbsp;Bagels/);
  assert.match(html, /font-weight:700;"><span style="">3:00 PM/);
  assert.match(html, /— Hudson &amp; Molly/);
  assert.match(text, /1 MetLife Stadium Dr\n10:00 AM  Bagels\n3:00 PM  Dinner\n\nBag policy[\s\S]*— Hudson & Molly\n\nRSVP:/);
});

test("personal invites greet the guest; reminders ask plainly", () => {
  const mine = inviteEmail(event, "https://chirk.fyi/t/r/abc/remember?to=invite", "Sam & Lee");
  assert.match(mine.html, /Hi Sam &amp; Lee, you&#39;re invited!|Hi Sam &amp; Lee, you're invited!/);
  assert.match(mine.text, /^Hi Sam & Lee, you're invited!\n\nJets <vs> Bills/);
  const r = reminderEmail({ ...event, rsvp_by: "2026-11-10" }, "https://chirk.fyi/t/r/abc/remember?to=invite", "Sam");
  assert.equal(r.subject, "Can you make Jets <vs> Bills?");
  assert.match(r.text, /^Hi Sam! Can you make Jets <vs> Bills on Sunday, November 15\? Let us know by Tuesday, November 10\.\n\nRSVP: https/);
  assert.match(r.html, /href="https:\/\/chirk\.fyi\/t\/r\/abc\/remember\?to=invite"/);
});
