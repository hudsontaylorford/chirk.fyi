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

/** Each person's balance: positive = they're owed money, negative = they owe. Payments made count toward it. */
export function balances(costs: Cost[], payments: Payment[]) {
  const b = new Map<string, number>();
  const add = (who: string, cents: number) => b.set(who, (b.get(who) ?? 0) + cents);
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
