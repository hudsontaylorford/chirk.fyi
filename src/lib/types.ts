export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM:SS
  place: string | null;
  address: string | null;
  details: string | null;
  rsvp_by: string | null;
  cover_url: string | null;
  bring_prompt: string | null;
  status: "draft" | "live" | "archived";
  ask_kids: boolean;
}

export interface Household {
  id: string;
  token: string;
  names: string[];
  going: boolean;
  kids: number;
  note: string | null;
  updated_by: string | null;
  email: string | null;
}

export interface Item {
  id: string;
  kind: "needed" | "main" | "extra";
  name: string;
  household_id: string | null;
}

export interface EventData {
  event: Event;
  households: Household[];
  items: Item[];
}
