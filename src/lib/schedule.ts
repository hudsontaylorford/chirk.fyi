import { clock } from "./format.ts";

export interface Stage {
  when: string; // "10 am" (or "10:00 AM" with the event's setting), or the host's word ("Late")
  what: string;
  at: string | null; // "HH:MM" when the line starts with a clock time
  main: boolean; // the line at the event's start time
}

/**
 * The host's schedule, one stage per line, time first: "10am Bagels", "4:30 pm Dinner", "Late - Leftovers".
 * A line without a clock time uses the words before " - " or ":", else its first word, as the time.
 */
export function parseSchedule(text: string | null, start: string | null, long = false): Stage[] {
  const main = start?.slice(0, 5) ?? null;
  return (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const m = line.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?(?=\s|$)\s*[-–—:·]?\s*(.*)$/i);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && Number(m[2] ?? 0) < 60) {
      let h = Number(m[1]) % 12;
      // No am/pm: 8–11 reads as morning, everything else as afternoon or evening.
      const pm = m[3] ? m[3].toLowerCase() === "p" : !(h >= 8 && h <= 11);
      if (pm) h += 12;
      const at = `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
      return { when: clock(at, long), what: m[4] || line, at, main: at === main };
    }
    const split = line.match(/^(.{1,20}?)\s*(?:\s[-–—]\s|:\s)\s*(.+)$/) ?? line.match(/^(\S+)\s+(.+)$/);
    return { when: split?.[1] ?? "", what: split?.[2] ?? line, at: null, main: false };
  });
}

/** The parts of the day guests can pick (any number of them). */
export const partChoices = (stages: Stage[]) => [...new Set(stages.map((s) => s.what))];

/**
 * Replies from before guests could pick several parts said one arrival time ("Snacks & wine").
 * Read that as that part through the main one (or just that part if the day has no main one).
 */
export function partsFromArrival(stages: Stage[], arrival: string | null): string[] {
  const parts = partChoices(stages);
  const from = parts.indexOf(arrival ?? "");
  if (from < 0) return [];
  const main = stages.findIndex((s) => s.main);
  return parts.slice(from, main >= from ? main + 1 : from + 1);
}
