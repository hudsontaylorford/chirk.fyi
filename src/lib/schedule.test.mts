import { test } from "node:test";
import assert from "node:assert/strict";
import { arrivalChoices, parseSchedule } from "./schedule.ts";

const text = "10am Bagels & coffee\n1pm Snacks & wine\n\n4:30 pm Thanksgiving dinner\nLate Leftover sandwiches";

test("reads time-first lines and marks the one at the start time", () => {
  const s = parseSchedule(text, "16:30:00");
  assert.deepEqual(s.map((x) => [x.when, x.what, x.main]), [
    ["10 am", "Bagels & coffee", false],
    ["1 pm", "Snacks & wine", false],
    ["4:30 pm", "Thanksgiving dinner", true],
    ["Late", "Leftover sandwiches", false],
  ]);
});

test("guesses am/pm, and handles words and separators", () => {
  const s = parseSchedule("9 Coffee\n6:15 - Dinner\n12 Lunch\nLate night: Dessert\n4p.m. Games\nNo time here", null);
  assert.deepEqual(s.map((x) => [x.when, x.what, x.at]), [
    ["9 am", "Coffee", "09:00"],
    ["6:15 pm", "Dinner", "18:15"],
    ["12 pm", "Lunch", "12:00"],
    ["Late night", "Dessert", null],
    ["4 pm", "Games", "16:00"],
    ["No", "time here", null],
  ]);
  assert.equal(parseSchedule("2026 party", null)[0].at, null);
  assert.deepEqual(parseSchedule(null, null), []);
});

test("any typing style reads the same, shown in the event's style", () => {
  assert.deepEqual(parseSchedule("10:00 AM  Coffee\n3pm - Dinner", "15:00", true).map((x) => [x.when, x.what, x.main]), [
    ["10:00 AM", "Coffee", false],
    ["3:00 PM", "Dinner", true],
  ]);
});

test("arrival choices stop at the main stage", () => {
  assert.deepEqual(arrivalChoices(parseSchedule(text, "16:30")), ["Bagels & coffee", "Snacks & wine", "Thanksgiving dinner"]);
  assert.deepEqual(arrivalChoices(parseSchedule(text, null)), ["Bagels & coffee", "Snacks & wine", "Thanksgiving dinner"]);
});
