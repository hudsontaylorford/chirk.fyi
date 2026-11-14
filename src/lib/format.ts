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
