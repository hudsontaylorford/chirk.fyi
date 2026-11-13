import { shortDate } from "./format";
import type { Board } from "./types";
import type { RsvpFormProps, FormDish } from "@/components/RsvpForm";

/** Builds the RSVP form's props from the board, leaving out this guest's own claims. */
export function formProps(board: Board, guestId?: string): Omit<RsvpFormProps, "initial" | "preselectSlot"> {
  const others = board.dishes.filter(
    (d) => d.guest_id !== guestId && board.guests.find((g) => g.id === d.guest_id)?.status !== "no",
  );
  const names = new Map(board.guests.map((g) => [g.id, g.name]));
  const takenSlots: Record<string, string> = {};
  for (const d of others) if (d.slot_id) takenSlots[d.slot_id] = names.get(d.guest_id) ?? "someone";
  return {
    slug: board.event.slug,
    dishDeadline: board.event.dish_name_deadline ? shortDate(board.event.dish_name_deadline) : null,
    categories: board.categories.map((c) => ({ ...c, othersCount: others.filter((d) => d.category_id === c.id).length })),
    slots: board.slots,
    takenSlots,
    hostName: "Hudson & Molly",
  };
}

export function initialFor(board: Board, guestId: string): RsvpFormProps["initial"] {
  const g = board.guests.find((x) => x.id === guestId)!;
  const dishes: FormDish[] = board.dishes
    .filter((d) => d.guest_id === guestId)
    .map((d) => ({
      key: d.id, id: d.id, category_id: d.category_id, slot_id: d.slot_id, dish_name: d.dish_name ?? "",
      kitchen_needs: d.kitchen_needs, oven_temp_f: d.oven_temp_f, oven_minutes: d.oven_minutes,
      timing: d.timing ?? "before", notes: d.notes, assigned_by_host: d.assigned_by_host,
    }));
  return {
    token: g.edit_token, name: g.name, status: g.status === "invited" ? "yes" : g.status,
    adults: g.adults, kids: g.kids, dietary_notes: g.dietary_notes, arrival_window: g.arrival_window, dishes,
  };
}
