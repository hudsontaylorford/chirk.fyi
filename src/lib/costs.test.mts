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
  // c hasn't cashed out, but in ($80) already equals out ($80): c left with $0, so it settles.
  assert.equal(game.ready, true);
  assert.deepEqual([...game.inferred], [["c", 0]]);
  // Exactly one missing and $15 still on the table: that $15 is theirs.
  const one = poker([
    { who: "a", kind: "buyin", amount: 2000 }, { who: "b", kind: "buyin", amount: 2000 },
    { who: "a", kind: "cashout", amount: 2500 },
  ]);
  assert.equal(one.ready, true);
  assert.deepEqual([...one.inferred], [["b", 1500]]);
  // Two missing and money unaccounted for: can't know who has what, so it waits.
  const two = poker([
    { who: "a", kind: "buyin", amount: 2000 }, { who: "b", kind: "buyin", amount: 2000 }, { who: "c", kind: "buyin", amount: 2000 },
    { who: "a", kind: "cashout", amount: 2500 },
  ]);
  assert.equal(two.ready, false);
  assert.equal(two.allOut, false);
  // One missing but out is already over in: a typo somewhere, nothing to infer.
  assert.equal(poker([{ who: "a", kind: "buyin", amount: 100 }, { who: "b", kind: "buyin", amount: 100 }, { who: "a", kind: "cashout", amount: 300 }]).ready, false);
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

// Stress: hundreds of random nights. Whatever happens, money balances to the cent, following the settle-up
// leaves everyone square, nobody both pays and gets paid, and it never takes more payments than people minus one.
test("random nights always balance and settle", () => {
  let seed = 42;
  const rand = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2147483648) % n);
  for (let round = 0; round < 500; round++) {
    const people = Array.from({ length: 2 + rand(9) }, (_, i) => `p${i}`);
    const costs = Array.from({ length: rand(6) }, () => {
      const split = people.filter(() => rand(3) > 0).map((who) => ({ who, shares: 1 + rand(3) }));
      return { amount: 1 + rand(100_000), paidBy: people[rand(people.length)], split: split.length ? split : [{ who: people[0], shares: 1 }] };
    });
    const entries = people.filter(() => rand(2)).flatMap((who) => [
      { who, kind: "buyin" as const, amount: 100 * (1 + rand(50)) },
      ...(rand(3) ? [{ who, kind: "buyin" as const, amount: 100 * (1 + rand(50)) }] : []),
    ]);
    const pot = entries.reduce((n, e) => n + e.amount, 0);
    // Hand the pot back out at random so cash-outs equal buy-ins.
    const players = [...new Set(entries.map((e) => e.who))];
    let left = pot;
    const outs = players.map((who, i) => {
      const amount = i === players.length - 1 ? left : rand(left + 1);
      left -= amount;
      return { who, kind: "cashout" as const, amount };
    });
    const game = poker([...entries, ...outs]);
    if (players.length) assert.equal(game.ready, true);

    const b = balances(costs, [], game.ready ? game.nets : undefined);
    assert.equal([...b.values()].reduce((n, v) => n + v, 0), 0, "money in = money out");
    const pay = settle(b);
    assert.ok(pay.length <= Math.max(0, people.length - 1), "few payments");
    assert.ok(pay.every((p) => p.amount > 0 && p.from !== p.to));
    const payers = new Set(pay.map((p) => p.from));
    assert.ok(pay.every((p) => !payers.has(p.to)), "nobody both pays and gets paid");
    assert.deepEqual(settle(balances(costs, pay, game.ready ? game.nets : undefined)), [], "after paying, everyone's square");
    // Paying only some of it leaves exactly the rest.
    if (pay.length > 1) assert.deepEqual(settle(balances(costs, pay.slice(1), game.ready ? game.nets : undefined)), [pay[0]]);
  }
});
