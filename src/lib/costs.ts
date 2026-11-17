// Shared costs: who paid what, who owes whom, settled in as few payments as possible. Pure; amounts are whole cents.

export type Cost = { amount: number; paidBy: string; split: { who: string; shares: number }[] };
export type Payment = { from: string; to: string; amount: number };

/** Splits cents by shares exactly: leftover cents go one each to the biggest shares first (then list order). */
export function shareOut(amount: number, split: { who: string; shares: number }[]) {
  const total = split.reduce((n, s) => n + s.shares, 0);
  if (!total) return new Map<string, number>();
  const parts = split.map((s) => ({ who: s.who, shares: s.shares, cents: Math.floor((amount * s.shares) / total) }));
  let left = amount - parts.reduce((n, p) => n + p.cents, 0);
  for (const p of [...parts].sort((a, b) => b.shares - a.shares)) if (left-- > 0) p.cents++;
  return new Map(parts.map((p) => [p.who, p.cents]));
}

/**
 * Each person's balance: positive = they're owed money, negative = they owe. Payments made count toward it.
 * `extra` adds other results to the same balances (a finished poker game's nets).
 */
export function balances(costs: Cost[], payments: Payment[], extra = new Map<string, number>()) {
  const b = new Map<string, number>();
  const add = (who: string, cents: number) => b.set(who, (b.get(who) ?? 0) + cents);
  for (const [who, cents] of extra) add(who, cents);
  for (const c of costs) {
    add(c.paidBy, c.amount);
    for (const [who, cents] of shareOut(c.amount, c.split)) add(who, -cents);
  }
  for (const p of payments) { add(p.from, p.amount); add(p.to, -p.amount); }
  return b;
}

/** Who pays whom: the biggest debt goes to the biggest credit, repeated, so there are few payments. */
export function settle(b: Map<string, number>): Payment[] {
  const owe = [...b].filter(([, v]) => v < 0).map(([who, v]) => ({ who, v: -v })).sort((x, y) => y.v - x.v);
  const owed = [...b].filter(([, v]) => v > 0).map(([who, v]) => ({ who, v })).sort((x, y) => y.v - x.v);
  const out: Payment[] = [];
  for (let i = 0, j = 0; i < owe.length && j < owed.length; ) {
    const amount = Math.min(owe[i].v, owed[j].v);
    out.push({ from: owe[i].who, to: owed[j].who, amount });
    owe[i].v -= amount;
    owed[j].v -= amount;
    if (!owe[i].v) i++;
    if (!owed[j].v) j++;
  }
  return out;
}

/** "$42", "$42.50" or "$1,200". */
export function money(cents: number) {
  const dollars = (cents / 100).toFixed(cents % 100 ? 2 : 0);
  return "$" + dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "42.50" or "$1,200" typed by a person → cents, or null if it isn't an amount. */
export function parseMoney(text: string) {
  const t = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const cents = Math.round(Number(t) * 100);
  return cents > 0 && cents <= 10_000_000 ? cents : null;
}

/** Opens Venmo with the payment filled in (the app on a phone, the site elsewhere). */
export function venmoUrl(handle: string, cents: number, note: string) {
  const user = handle.replace(/^@/, "").trim();
  return `https://venmo.com/${encodeURIComponent(user)}?txn=pay&amount=${(cents / 100).toFixed(2)}&note=${encodeURIComponent(note)}`;
}

export type PokerEntry = { who: string; kind: "buyin" | "cashout"; amount: number };

/**
 * A poker game from its buy-ins (rebuys are more buy-ins) and cash-outs (each player's latest one counts).
 * It's ready to settle when the money in equals the money out. Missing cash-outs are worked out when the math allows:
 * if the totals already match, anyone missing left with $0; if exactly one person is missing, what's left on the table is theirs.
 * Those worked-out amounts are in `inferred` (and in each player's `out`), so the page can say so.
 */
export function poker(entries: PokerEntry[]) {
  const players = new Map<string, { in: number; out: number | null }>();
  for (const e of entries) {
    const p = players.get(e.who) ?? { in: 0, out: null };
    if (e.kind === "buyin") p.in += e.amount;
    else p.out = e.amount;
    players.set(e.who, p);
  }
  const totalIn = [...players.values()].reduce((n, p) => n + p.in, 0);
  const counted = [...players.values()].reduce((n, p) => n + (p.out ?? 0), 0);
  const missing = [...players].filter(([, p]) => p.out === null && p.in > 0).map(([who]) => who);
  const left = totalIn - counted; // still on the table
  const inferred = new Map<string, number>();
  if (missing.length && (left === 0 || (missing.length === 1 && left > 0))) {
    for (const who of missing) { inferred.set(who, missing.length === 1 ? left : 0); players.get(who)!.out = inferred.get(who)!; }
  }
  const totalOut = [...players.values()].reduce((n, p) => n + (p.out ?? 0), 0);
  const allOut = [...players.values()].every((p) => p.out !== null || p.in === 0);
  const ready = players.size > 0 && allOut && totalIn === totalOut;
  const nets = new Map([...players].map(([who, p]) => [who, (p.out ?? 0) - p.in]));
  return { players, totalIn, totalOut, allOut, ready, nets, inferred };
}

/**
 * The event's whole settle-up: its costs (only while "Split costs" is on) plus a poker game once it's ready.
 * One place for the Costs section, Mark paid and the host page's tiles, so they always agree.
 */
export function settleUp<C extends { amount: number; paid_by: string; split: { who: string; shares: number }[] }>(
  all: { costs: C[]; payments: Payment[]; poker: PokerEntry[] },
  costsOn: boolean,
) {
  const costs = costsOn ? all.costs : [];
  const game = poker(all.poker);
  const owed = settle(balances(costs.map((c) => ({ amount: c.amount, paidBy: c.paid_by, split: c.split })), all.payments, game.ready ? game.nets : undefined));
  return { costs, game, owed };
}
