import { test } from "node:test";
import assert from "node:assert/strict";
import { answersTable, cleanAnswers, pollChoices, questionsFromForm, questionsOf, tally } from "./poll.ts";

test("choices: one per line, trimmed, no blanks or repeats, up to 20", () => {
  assert.deepEqual(pollChoices(" Dec 5 \n\nDec 12\ndec 5\nDec 19"), ["Dec 5", "Dec 12", "Dec 19"]);
  assert.deepEqual(pollChoices(null), []);
  assert.equal(pollChoices(Array.from({ length: 30 }, (_, i) => String(5 + i / 2)).join("\n")).length, 20);
});

test("form: up to 3 questions, blanks and repeats dropped", () => {
  const f: Record<string, string> = { question_0: "Which shoe?", choices_0: "Diana\nJax", one_0: "on", question_1: "", question_2: "Which shoe?" };
  assert.deepEqual(questionsFromForm((k) => f[k] ?? "", (k) => f[k] === "on"), [{ q: "Which shoe?", choices: ["Diana", "Jax"], one: true }]);
});

test("guests see only questions with two or more choices", () => {
  assert.deepEqual(questionsOf({ questions: [{ q: "A?", choices: ["x"], one: false }, { q: "B?", choices: ["x", "y"], one: false }] }).map((x) => x.q), ["B?"]);
  assert.deepEqual(questionsOf({ questions: null }), []);
});

test("answers: only real choices; pick-one keeps one", () => {
  const qs = [{ q: "Shoe?", choices: ["Diana", "Jax"], one: true }, { q: "Day?", choices: ["Sat", "Sun"], one: false }];
  assert.deepEqual(cleanAnswers(qs, { "Shoe?": ["Jax", "Diana"], "Day?": ["Sat", "Mon", "Sun"], "Gone?": ["x"] }), { "Shoe?": ["Diana"], "Day?": ["Sat", "Sun"] });
  assert.deepEqual(cleanAnswers(qs, undefined), {});
});

test("tally ignores picks of removed choices", () => {
  const x = { q: "Q?", choices: ["A", "B"], one: false };
  const hs = [{ id: 1, answers: { "Q?": ["A", "Gone"] } }, { id: 2, answers: { "Q?": ["A", "B"] } }, { id: 3, answers: null }];
  assert.deepEqual(tally(x, hs).map((t) => [t.choice, t.by.map((h) => h.id)]), [["A", [1, 2]], ["B", [2]]]);
});

test("answers table: one row per reply, one line per cell", () => {
  const e = { questions: [{ q: "Shoe?", choices: ["Diana", "Jax"], one: true }], note_prompt: "Shipping address" };
  const t = answersTable(e, [{ names: ["Sam", "Lee"], email: "s@x.co", going: true, note: "1 Main St\nApt 2", answers: { "Shoe?": ["Jax"] } }]);
  assert.equal(t, "Name\tEmail\tReply\tShoe?\tShipping address\nSam & Lee\ts@x.co\tGoing\tJax\t1 Main St, Apt 2");
});
