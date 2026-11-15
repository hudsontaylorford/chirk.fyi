import { test } from "node:test";
import assert from "node:assert/strict";
import { drawNames } from "./gifts.ts";

const seeded = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const valid = (people: string[], never: [string, string][], m: Map<string, string> | null) => {
  assert.ok(m, "a draw was found");
  assert.deepEqual([...m.keys()].sort(), [...people].sort(), "everyone gives");
  assert.deepEqual([...m.values()].sort(), [...people].sort(), "everyone receives exactly once");
  for (const [g, r] of m) {
    assert.notEqual(g, r, "nobody draws themselves");
    assert.ok(!never.some(([a, b]) => (a === g && b === r) || (a === r && b === g)), `${g} → ${r} breaks a rule`);
  }
};

test("follows every rule, over many random draws", () => {
  for (let s = 1; s <= 300; s++) {
    const rand = seeded(s);
    const people = Array.from({ length: 3 + Math.floor(rand() * 10) }, (_, i) => `p${i}`);
    const never: [string, string][] = [];
    for (let k = 0; k < people.length / 2; k++) never.push([people[Math.floor(rand() * people.length)], people[Math.floor(rand() * people.length)]]);
    const m = drawNames(people, never, rand);
    if (m) valid(people, never, m);
  }
});

test("hard cases and impossible ones", () => {
  // Hudson can't draw Molly, and two couples can't draw each other's partner.
  const people = ["hudson", "molly", "sam", "priya", "lee"];
  const never: [string, string][] = [["hudson", "molly"], ["sam", "priya"]];
  for (let s = 1; s <= 50; s++) valid(people, never, drawNames(people, never, seeded(s)));
  assert.equal(drawNames(["a"], []), null); // one person can't swap with anyone
  assert.equal(drawNames(["a", "b"], [["a", "b"]]), null); // the only two can't draw each other
  assert.equal(drawNames(["a", "b", "c"], [["a", "b"], ["a", "c"]]), null); // a has nobody to draw
  valid(["a", "b"], [], drawNames(["a", "b"], []));
});

test("draws vary", () => {
  const people = ["a", "b", "c", "d", "e"];
  const seen = new Set(Array.from({ length: 40 }, (_, s) => JSON.stringify([...drawNames(people, [], seeded(s + 1))!])));
  assert.ok(seen.size > 5, "not the same draw every time");
});
