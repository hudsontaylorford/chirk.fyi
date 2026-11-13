import type { Board, Category, Dish, Guest, Slot } from "./types";

export interface CategorySummary {
  category: Category;
  dishes: (Dish & { guest: Guest })[];
  count: number;
  overCap: boolean;
  atCap: boolean;
}

/** Everything the menu board needs, derived from raw rows. */
export function summarize(board: Board) {
  const guests = new Map(board.guests.map((g) => [g.id, g]));
  const attending = (d: Dish) => guests.get(d.guest_id)?.status !== "no";
  const dishes = board.dishes.filter(attending).map((d) => ({ ...d, guest: guests.get(d.guest_id)! }));

  const claimBySlot = new Map<string, Dish & { guest: Guest }>();
  for (const d of dishes) if (d.slot_id) claimBySlot.set(d.slot_id, d);

  const openSlots: Slot[] = board.slots.filter((s) => !claimBySlot.has(s.id));
  const categories: CategorySummary[] = board.categories.map((c) => {
    const list = dishes.filter((d) => d.category_id === c.id);
    const count = list.length;
    return {
      category: c,
      dishes: list,
      count,
      atCap: c.soft_cap != null && count >= c.soft_cap,
      overCap: c.soft_cap != null && count > c.soft_cap,
    };
  });

  const coming = board.guests.filter((g) => g.status === "yes");
  const maybe = board.guests.filter((g) => g.status === "maybe");
  return {
    claimBySlot,
    openSlots,
    categories,
    headcount: {
      adults: coming.reduce((n, g) => n + g.adults, 0),
      kids: coming.reduce((n, g) => n + g.kids, 0),
      maybeAdults: maybe.reduce((n, g) => n + g.adults, 0),
      maybeKids: maybe.reduce((n, g) => n + g.kids, 0),
      households: coming.length,
    },
  };
}

export function dishLabel(d: Dish, board: Pick<Board, "slots" | "categories">) {
  const slot = d.slot_id ? board.slots.find((s) => s.id === d.slot_id) : null;
  const cat = board.categories.find((c) => c.id === d.category_id);
  if (d.dish_name) return d.dish_name;
  if (slot) return slot.name;
  return `${singular(cat?.name ?? "Dish")} (TBD)`;
}

export function singular(name: string) {
  const map: Record<string, string> = { Apps: "App", Desserts: "Dessert", Drinks: "Drinks", "Extra sides": "Side" };
  return map[name] ?? name.replace(/s$/, "");
}
