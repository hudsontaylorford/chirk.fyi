import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarSpan, headcount, listText, several, splitNames, when } from "./format.ts";

test("time range text", () => {
  assert.equal(when({ date: "2026-11-15", time: "07:45:00", end_time: "16:00:00" }), "Sunday, November 15 · 7:45 am – 4 pm");
  assert.equal(when({ date: "2026-11-15", time: "07:45:00", end_time: null }), "Sunday, November 15 · 7:45 am");
  assert.equal(when({ date: "2026-11-15", time: null }), "Sunday, November 15");
  assert.equal(when({ date: "2026-11-26", time: "15:00:00", end_time: "21:30:00", long_times: true }), "Thursday, November 26 · 3:00 PM – 9:30 PM");
});

test("calendar span: end time, default 3 hours, past midnight", () => {
  assert.deepEqual(calendarSpan("2026-11-15", "07:45:00", "16:00:00"), { start: "20261115T074500", end: "20261115T160000" });
  assert.deepEqual(calendarSpan("2026-11-26", "16:30:00", null), { start: "20261126T163000", end: "20261126T193000" });
  assert.deepEqual(calendarSpan("2026-12-31", "20:00:00", "01:00:00"), { start: "20261231T200000", end: "20270101T010000" });
});

test("wording helpers", () => {
  assert.equal(listText(["Ham"]), "Ham");
  assert.equal(listText(["Ham", "Salad", "Pie"]), "Ham, Salad and Pie");
  assert.equal(listText(["Thanksgiving Dinner", "Games and Dessert"]), "Thanksgiving Dinner · Games and Dessert");
  assert.ok(several("Graham and Ellen") && several("Sam & Priya") && !several("Sandy") && !several("Andrea"));
});

test("people typed together count separately", () => {
  assert.deepEqual(splitNames(["Graham and Ellen"]), ["Graham", "Ellen"]);
  assert.deepEqual(splitNames(["Sam & Priya", "Dev"]), ["Sam", "Priya", "Dev"]);
  assert.deepEqual(splitNames(["Sam&Priya"]), ["Sam", "Priya"]);
  assert.equal(headcount(["Andrea"]), 1);
  assert.equal(headcount(["Hudson", "Molly"]), 2);
  assert.equal(headcount(["Graham and Ellen"]), 2);
  assert.equal(headcount(["Brandon"]), 1); // "and" inside a name isn't a split
});
