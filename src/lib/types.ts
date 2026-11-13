export type KitchenNeed = "ready" | "oven" | "stovetop" | "outlet" | "fridge";
export type Timing = "before" | "after";
export type RsvpStatus = "yes" | "maybe" | "no" | "invited";
export type Arrival = "morning" | "afternoon" | "dinner";

export interface EventTheme {
  background?: string;
  ink?: string;
  collage?: string;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  event_date: string; // YYYY-MM-DD
  dinner_time: string; // HH:MM:SS
  meal_minutes: number;
  max_dishes_per_guest: number;
  timezone: string;
  location_name: string | null;
  address: string | null;
  invite_copy: string | null;
  closing_note: string | null;
  house_rules: string | null;
  rsvp_deadline: string | null;
  dish_name_deadline: string | null;
  theme: EventTheme;
}

export interface Category {
  id: string;
  name: string;
  kind: "core" | "open";
  soft_cap: number | null;
  nudge: string | null;
  description: string | null;
  sort_order: number;
}

export interface Slot {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Guest {
  id: string;
  name: string;
  edit_token: string;
  status: RsvpStatus;
  adults: number;
  kids: number;
  dietary_notes: string | null;
  arrival_window: Arrival | null;
  note: string | null;
  created_at: string;
}

export interface Dish {
  id: string;
  guest_id: string;
  category_id: string;
  slot_id: string | null;
  dish_name: string | null;
  kitchen_needs: KitchenNeed[];
  oven_temp_f: number | null;
  oven_minutes: number | null;
  timing: Timing | null;
  oven_ready_at: string | null;
  assigned_by_host: boolean;
  notes: string | null;
}

export interface KitchenResource {
  id: string;
  kind: string;
  label: string;
  quantity: number;
  capacity: number;
}

export interface Board {
  event: EventRow;
  categories: Category[];
  slots: Slot[];
  guests: Guest[];
  dishes: Dish[];
  kitchen: KitchenResource[];
}

export const KITCHEN_NEEDS: { value: KitchenNeed; label: string }[] = [
  { value: "ready", label: "Arrives ready" },
  { value: "oven", label: "Oven" },
  { value: "stovetop", label: "Stovetop" },
  { value: "outlet", label: "Slow cooker / outlet" },
  { value: "fridge", label: "Fridge space" },
];

export const ARRIVALS: { value: Arrival; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "for bagels" },
  { value: "afternoon", label: "Afternoon", hint: "for apps" },
  { value: "dinner", label: "Just for dinner", hint: "" },
];
