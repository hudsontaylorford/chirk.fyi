import { test } from "node:test";
import assert from "node:assert/strict";
import { daysBefore, dueJobs, type Job } from "./due.ts";

const ev = {
  status: "live", date: "2026-12-20", rsvp_by: "2026-12-10", remind_replies: true,
  gift_on: true, gift_draw_on: "2026-12-01", gift_remind_ideas: true, gift_remind_givers: true,
};
const none = new Set<Job>();

test("day math", () => {
  assert.equal(daysBefore("2026-12-01", 3), "2026-11-28");
  assert.equal(daysBefore("2026-03-01", 1), "2026-02-28");
});

test("each job on its day, and catching up a missed day", () => {
  assert.deepEqual(dueJobs(ev, "2026-11-27", none), []);
  assert.deepEqual(dueJobs(ev, "2026-11-28", none), ["gift_ideas"]); // 3 days before the draw
  assert.deepEqual(dueJobs(ev, "2026-11-30", none), ["gift_ideas"]); // missed mornings still catch up…
  assert.deepEqual(dueJobs(ev, "2026-12-01", none), ["gift_draw"]); // …but not once the draw has come
  assert.deepEqual(dueJobs(ev, "2026-12-07", new Set<Job>(["gift_draw"])), ["reply_reminder"]); // 3 days before reply-by
  assert.deepEqual(dueJobs(ev, "2026-12-13", new Set<Job>(["gift_draw", "reply_reminder"])), ["gift_givers"]); // a week before the event
  assert.deepEqual(dueJobs(ev, "2026-12-20", new Set<Job>(["gift_draw"])), []); // the day itself: too late to nudge
});

test("never twice, nothing for drafts, and only what's switched on", () => {
  assert.deepEqual(dueJobs(ev, "2026-11-28", new Set<Job>(["gift_ideas"])), []);
  assert.deepEqual(dueJobs({ ...ev, status: "draft" }, "2026-12-01", none), []);
  assert.deepEqual(dueJobs({ ...ev, gift_remind_ideas: false }, "2026-11-28", none), []);
  assert.deepEqual(dueJobs({ ...ev, gift_on: false }, "2026-12-01", none), []);
  assert.deepEqual(dueJobs({ ...ev, remind_replies: false }, "2026-12-08", new Set<Job>(["gift_draw"])), []);
  assert.deepEqual(dueJobs({ ...ev, gift_draw_on: null }, "2026-12-01", none), []);
});
