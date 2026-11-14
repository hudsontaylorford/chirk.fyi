export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM:SS
  end_time: string | null;
  place: string | null;
  address: string | null;
  details: string | null;
  rsvp_by: string | null;
  cover_url: string | null;
  bring_prompt: string | null;
  status: "draft" | "live" | "archived";
  ask_kids: boolean;
  notify_host: boolean;
  note_prompt: string | null;
  note_hint: string | null;
  allow_doubles: boolean;
  allow_own: boolean;
  notes_public: boolean;
  max_guests: number | null; // extra people per reply; null = no limit
  schedule: string | null; // one stage per line, time first
  ask_arrival: boolean;
  hosted_by: string | null;
  long_times: boolean; // 3:00 PM instead of 3 pm
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
  arrival: string | null; // the stage they're coming for
}

export interface Item {
  id: string;
  kind: "needed" | "main" | "extra";
  name: string;
  household_id: string | null;
}

export interface Claim {
  item_id: string;
  household_id: string;
}

export interface EventData {
  event: Event;
  households: Household[];
  items: Item[]; // household_id = who added it (guest-added items only)
  claims: Claim[]; // who's bringing what, oldest first
}
