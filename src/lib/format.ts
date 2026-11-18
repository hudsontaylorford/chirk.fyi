// Dates are stored as plain YYYY-MM-DD and times as HH:MM, already in New York time.

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export const longDate = (d: string) => fmt(d, { weekday: "long", month: "long", day: "numeric" });
export const shortDate = (d: string) => fmt(d, { weekday: "short", month: "short", day: "numeric" });

/** "3 pm", or with `long` (the event's "3:00 PM" setting) "3:00 PM". */
export function clock(t: string, long = false) {
  const [h, m] = t.split(":").map(Number);
  if (long) return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}

export function mapsUrl(address: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

/** "Sunday, November 15 · 7:45 am – 4 pm" (end optional). */
export function when(e: { date: string; time: string | null; end_time?: string | null; long_times?: boolean }) {
  if (!e.time) return longDate(e.date);
  const c = (t: string) => clock(t, e.long_times);
  return `${longDate(e.date)} · ${c(e.time)}${e.end_time ? ` – ${c(e.end_time)}` : ""}`;
}

/**
 * Calendar start and end as local YYYYMMDDTHHMMSS. With no end time the event runs 3 hours;
 * an end at or before the start means it ends the next day (8 pm – 1 am).
 */
export function calendarSpan(date: string, time: string, end: string | null) {
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const start = toMin(time);
  let stop = end ? toMin(end) : start + 180;
  if (stop <= start) stop += 24 * 60;
  const stamp = (mins: number) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCMinutes(mins);
    return d.toISOString().slice(0, 19).replace(/[-:]/g, "");
  };
  return { start: stamp(start), end: stamp(stop) };
}

/** "Graham and Ellen" or "Sam & Priya" is more than one person, even typed in one box. */
export const several = (who: string) => /,|&|\band\b/i.test(who);

/** "Ham, Salad and Pie"; with an "and" inside an item ("Games and Dessert"), "Dinner · Games and Dessert" so it stays clear. */
export const listText = (xs: string[]) =>
  xs.some((x) => /\band\b|&/i.test(x)) ? xs.join(" · ") : xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

/** "Graham and Ellen", "Sam & Priya" or "Sam, Priya" typed in one box is two people; "Andrea" stays one. */
export const splitNames = (names: string[]) =>
  names.flatMap((n) => n.split(/\s*,\s*|\s+(?:&|and)\s+|\s*&\s*/i)).map((n) => n.trim()).filter(Boolean);

/** How many people a reply is (before kids). */
export const headcount = (names: string[]) => splitNames(names).length;

/** Who a guest message reaches: replies in the group and how many have an email (never a bare "0"). */
export function reach({ email, total }: { email: number; total: number }) {
  if (!total) return "Nobody in this group yet.";
  if (!email) return total === 1 ? "No email on file for this reply, so text them yourself." : `None of these ${total} replies have an email on file, so text them yourself.`;
  const head = email < total ? `Goes to ${email} of ${total} replies.` : total === 1 ? "Goes to the 1 reply." : `Goes to all ${total} replies.`;
  const missing = total - email;
  return missing ? `${head} ${missing} ${missing === 1 ? "has" : "have"} no email on file, so text them yourself.` : head;
}
