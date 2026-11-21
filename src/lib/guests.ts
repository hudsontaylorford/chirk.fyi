// Turning the host's "Add guests" box into replies-to-be, and the words of a reminder. Pure.
import { longDate } from "./format.ts";

/**
 * "Sam, Graham & Ellen graham@x.com" → [{ names: ["Sam"] }, { names: ["Graham", "Ellen"], email: "graham@x.com" }].
 * Commas or new lines separate replies; "&" or "and" keeps a couple on one reply; an email anywhere in an entry is theirs.
 */
export function parseGuests(text: string) {
  return text.split(/[,\n]/).map((entry) => {
    const email = entry.match(/[^\s<>()]+@[^\s<>()]+\.[^\s<>()]+/)?.[0].toLowerCase() ?? null;
    const names = entry.replace(email ? new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : /$^/, "")
      .replace(/[<>()]/g, " ").split(/\s+(?:&|and)\s+|\s*&\s*/i)
      .map((n) => n.trim().replace(/\s+/g, " ").slice(0, 60)).filter(Boolean);
    return { names, email };
  }).filter((g) => g.names.length).slice(0, 100);
}

/** A short nudge for someone who hasn't answered, for a text or an email. */
/** A personal invite as a text message, sent from the host's own phone. */
export function inviteText(e: { title: string; date: string }, names: string, url: string) {
  return `Hi ${names}! You’re invited to ${e.title} on ${longDate(e.date)}. RSVP here: ${url}`;
}

export function reminderText(e: { title: string; date: string; rsvp_by: string | null }, names: string, url?: string) {
  const by = e.rsvp_by ? ` by ${longDate(e.rsvp_by)}` : "";
  return `Hi ${names}, can you make ${e.title} on ${longDate(e.date)}? ${url ? `Let us know here${by}: ${url}` : `Let us know${by}.`}`;
}
