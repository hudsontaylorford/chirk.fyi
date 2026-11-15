import { test } from "node:test";
import assert from "node:assert/strict";
import { balances, money, parseMoney, poker, settle, shareOut, venmoUrl } from "./costs.ts";

test("splits cents exactly, by person", () => {
  assert.deepEqual([...shareOut(1000, [{ who: "a", shares: 1 }, { who: "b", shares: 1 }, { who: "c", shares: 1 }])], [["a", 334], ["b", 333], ["c", 333]]);
  // A couple (2 shares) pays twice a single person.
  assert.deepEqual([...shareOut(65200, [{ who: "couple", shares: 2 }, { who: "sam", shares: 1 }, { who: "lee", shares: 1 }])], [["couple", 32600], ["sam", 16300], ["lee", 16300]]);
  const odd = shareOut(100, [{ who: "a", shares: 1 }, { who: "b", shares: 2 }]);
  assert.equal([...odd.values()].reduce((n, v) => n + v, 0), 100);
});

const tickets = { amount: 65200, paidBy: "couple", split: [{ who: "couple", shares: 2 }, { who: "sam", shares: 1 }, { who: "lee", shares: 1 }] };
const snacks = { amount: 4000, paidBy: "sam", split: [{ who: "sam", shares: 1 }, { who: "lee", shares: 1 }] };

test("balances and the fewest payments", () => {
  const b = balances([tickets, snacks], []);
  assert.deepEqual(Object.fromEntries(b), { couple: 32600, sam: -16300 + 2000, lee: -16300 - 2000 });
  assert.deepEqual(settle(b), [
    { from: "lee", to: "couple", amount: 18300 },
    { from: "sam", to: "couple", amount: 14300 },
  ]);
});

test("payments count, and everyone ends square", () => {
  const partly = balances([tickets, snacks], [{ from: "lee", to: "couple", amount: 18300 }]);
  assert.deepEqual(settle(partly), [{ from: "sam", to: "couple", amount: 14300 }]);
  const done = balances([tickets, snacks], [{ from: "lee", to: "couple", amount: 18300 }, { from: "sam", to: "couple", amount: 14300 }]);
  assert.deepEqual(settle(done), []);
});

test("money in and out", () => {
  assert.equal(money(16300), "$163");
  assert.equal(money(4250), "$42.50");
  assert.equal(money(120000), "$1,200");
  assert.equal(parseMoney("$1,200"), 120000);
  assert.equal(parseMoney("42.5"), 4250);
  assert.equal(parseMoney("0"), null);
  assert.equal(parseMoney("12.345"), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(venmoUrl("@sam-k", 16300, "Jets · tickets"), "https://venmo.com/sam-k?txn=pay&amount=163.00&note=Jets%20%C2%B7%20tickets");
});

test("poker: rebuys, cash-outs, ready only when the chips add up", () => {
  const game = poker([
    { who: "a", kind: "buyin", amount: 2000 }, { who: "b", kind: "buyin", amount: 2000 }, { who: "c", kind: "buyin", amount: 2000 },
    { who: "c", kind: "buyin", amount: 2000 }, // c rebuys
    { who: "a", kind: "cashout", amount: 5500 }, { who: "b", kind: "cashout", amount: 2500 },
  ]);
  assert.equal(game.totalIn, 8000);
  assert.equal(game.allOut, false); // c hasn't cashed out
  assert.equal(game.ready, false);
  const short = poker([...[{ who: "a", kind: "buyin", amount: 2000 }, { who: "a", kind: "cashout", amount: 1500 }] as const]);
  assert.equal(short.ready, false); // $5 missing from the count
  const done = poker([
    { who: "a", kind: "buyin", amount: 2000 }, { who: "b", kind: "buyin", amount: 2000 }, { who: "c", kind: "buyin", amount: 4000 },
    { who: "a", kind: "cashout", amount: 5500 }, { who: "b", kind: "cashout", amount: 2500 }, { who: "c", kind: "cashout", amount: 0 },
  ]);
  assert.equal(done.ready, true);
  assert.deepEqual(Object.fromEntries(done.nets), { a: 3500, b: 500, c: -4000 });
  // Poker joins the same settle-up as the night's costs: c pays a and b.
  assert.deepEqual(settle(balances([], [], done.nets)), [
    { from: "c", to: "a", amount: 3500 },
    { from: "c", to: "b", amount: 500 },
  ]);
  // A corrected cash-out replaces the earlier one.
  assert.equal(poker([{ who: "a", kind: "buyin", amount: 100 }, { who: "a", kind: "cashout", amount: 50 }, { who: "a", kind: "cashout", amount: 100 }]).ready, true);
});
