import type { Answers, Question } from "./poll";

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
  theme: string | null; // "#rrggbb" from the cover photo; null = plain
  bring_prompt: string | null;
  status: "draft" | "live" | "archived";
  ask_kids: boolean;
  notify_host: boolean;
  note_prompt: string | null;
  note_hint: string | null;
  allow_doubles: boolean;
  allow_own: boolean;
  notes_public: boolean;
  hide_guests: boolean; // guests don't see who's coming
  max_guests: number | null; // extra people per reply; null = no limit
  schedule: string | null; // one stage per line, time first
  ask_arrival: boolean;
  hosted_by: string | null;
  long_times: boolean; // 3:00 PM instead of 3 pm
  costs_on: boolean; // shared costs
  poker_on: boolean; // poker buy-ins and cash-outs
  gift_on: boolean; // gift exchange
  gift_budget: string | null;
  gift_rules: string | null;
  gift_never: [string, string][]; // pairs of replies who never draw each other
  gift_draw_on: string | null; // YYYY-MM-DD: names drawn automatically that morning
  gift_remind_ideas: boolean;
  gift_remind_givers: boolean;
  remind_replies: boolean;
  questions: Question[] | null; // up to 3, picked from chips when replying
}

export interface Household {
  id: string;
  token: string;
  names: string[];
  going: boolean | null; // null = invited by name, no answer yet
  kids: number;
  note: string | null;
  updated_by: string | null;
  email: string | null;
  arrival: string | null; // old: the one part they said they'd arrive for (see `parts`)
  parts: string[] | null; // the parts of the day they're coming to
  venmo: string | null;
  gift_in: boolean;
  gift_wish: string | null;
  answers: Answers | null; // question → what they picked
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
