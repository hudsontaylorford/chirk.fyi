import { test } from "node:test";
import assert from "node:assert/strict";
import { pollChoices, pollOn, tally } from "./poll.ts";

test("choices: one per line, trimmed, no blanks or repeats", () => {
  assert.deepEqual(pollChoices(" Dec 5 \n\nDec 12\ndec 5\nDec 19"), ["Dec 5", "Dec 12", "Dec 19"]);
  assert.deepEqual(pollChoices(null), []);
});

test("on only with a question and two or more choices", () => {
  assert.equal(pollOn({ poll_question: "Which?", poll_choices: "A\nB" }), true);
  assert.equal(pollOn({ poll_question: "Which?", poll_choices: "A" }), false);
  assert.equal(pollOn({ poll_question: null, poll_choices: "A\nB" }), false);
});

test("tally ignores picks of removed choices", () => {
  const hs = [{ id: 1, poll: ["A", "Gone"] }, { id: 2, poll: ["A", "B"] }, { id: 3, poll: null }];
  assert.deepEqual(tally(["A", "B"], hs).map((t) => [t.choice, t.by.map((h) => h.id)]), [["A", [1, 2]], ["B", [2]]]);
});
