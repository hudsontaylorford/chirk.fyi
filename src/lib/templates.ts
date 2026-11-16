// Starting points for New event. A template only fills in settings and example wording; everything stays editable,
// and nothing about the event remembers which one it came from.
import type { Event } from "./types";

export type Template = { id: string; label: string; set: Partial<Event> };

const allergies = { note_prompt: "Anything we should know?", note_hint: "Allergies, things you don't eat…" };

export const TEMPLATES: Template[] = [
  { id: "dinner", label: "Dinner or potluck", set: { bring_prompt: "What are you bringing?", allow_own: true, notify_host: true, ...allergies } },
  {
    id: "holiday-meal", label: "Holiday meal",
    set: { bring_prompt: "What are you bringing?", allow_own: true, ask_kids: true, notify_host: true, schedule: "2 pm Arrive\n4 pm Dinner\n6 pm Dessert", ...allergies },
  },
  { id: "party", label: "Party or birthday", set: { max_guests: 1, notify_host: true, note_prompt: "Anything we should know?", note_hint: "Arriving late, bringing a friend…" } },
  {
    id: "celebration", label: "Shower or celebration",
    set: { notify_host: true, notes_public: true, note_prompt: "A note for the guest of honor?", note_hint: "A wish, a memory, some advice…", schedule: "1 pm Arrive\n2 pm The main part\n4 pm Wrap up" },
  },
  { id: "game-night", label: "Game or watch night", set: { bring_prompt: "Bringing a snack or a drink?", allow_own: true, max_guests: 1 } },
  { id: "poker", label: "Poker night", set: { poker_on: true, max_guests: 0, bring_prompt: "Bringing a snack or a drink?", allow_own: true } },
  {
    id: "secret-santa", label: "Secret Santa",
    set: { gift_on: true, gift_remind_ideas: true, gift_remind_givers: true, gift_rules: "Bring it wrapped, with a tag. Keep who you drew a secret until it's opened." },
  },
  {
    // No names drawn: everyone brings one gift and the rules do the rest, so they live in the message.
    id: "white-elephant", label: "White elephant",
    set: {
      details: "**How it works**\n- Bring one wrapped gift, about $25\n- Everyone draws a number\n- On your turn, open a new gift or steal one that's been opened\n- A gift is safe after it's been stolen twice",
    },
  },
  { id: "outing", label: "Tickets or an outing", set: { costs_on: true, max_guests: 0, remind_replies: true, note_prompt: "Anything we should know?", note_hint: "Meeting there, running late…" } },
  { id: "quick", label: "Quick hang", set: { max_guests: null, notify_host: true } },
];

export const template = (id: string | undefined) => TEMPLATES.find((t) => t.id === id);
