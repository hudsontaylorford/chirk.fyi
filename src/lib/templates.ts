// Starting points for New event: only the ones that switch a feature on. A template fills in settings and example
// wording; everything stays editable, and nothing about the event remembers which one it came from.
import type { Event } from "./types";

export type Template = { id: string; label: string; set: Partial<Event> };

export const TEMPLATES: Template[] = [
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
];

export const template = (id: string | undefined) => TEMPLATES.find((t) => t.id === id);
