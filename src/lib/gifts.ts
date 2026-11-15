// Gift exchange: who gives to whom. Pure.

/**
 * A random draw: each person gives to exactly one other and receives from exactly one, never themselves,
 * and never across a "never draw each other" pair. `random` returns 0 ≤ x < 1 (pass a seeded one in tests).
 * Returns giver → receiver, or null if no draw can follow the rules.
 */
export function drawNames(people: string[], never: [string, string][], random: () => number = Math.random) {
  if (people.length < 2) return null;
  const blocked = (a: string, b: string) => a === b || never.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const shuffle = <T,>(xs: T[]) => {
    const out = [...xs];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  // Hardest givers first (fewest people they may draw), each trying receivers in a random order, backing up when stuck.
  const givers = shuffle(people).sort((a, b) => people.filter((p) => !blocked(a, p)).length - people.filter((p) => !blocked(b, p)).length);
  const taken = new Set<string>();
  const pick = new Map<string, string>();
  const go = (i: number): boolean => {
    if (i === givers.length) return true;
    for (const r of shuffle(people)) {
      if (taken.has(r) || blocked(givers[i], r)) continue;
      taken.add(r); pick.set(givers[i], r);
      if (go(i + 1)) return true;
      taken.delete(r); pick.delete(givers[i]);
    }
    return false;
  };
  return go(0) ? pick : null;
}
