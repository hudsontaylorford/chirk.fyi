import { getEvent } from "@/lib/data";
import { calendarSpan } from "@/lib/format";
import { parseSchedule } from "@/lib/schedule";

// "Add to calendar": a tiny .ics file the phone opens straight into Calendar.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug, true);
  if (!e) return new Response("Not found", { status: 404 });
  const day = e.date.replaceAll("-", "");
  // shortcut: New York time with no VTIMEZONE block; add a time zone field if events ever happen elsewhere.
  const span = e.time ? calendarSpan(e.date, e.time, e.end_time) : null;
  const when = span
    ? [`DTSTART;TZID=America/New_York:${span.start}`, `DTEND;TZID=America/New_York:${span.end}`]
    : [`DTSTART;VALUE=DATE:${day}`];
  const esc = (s: string) => s.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const schedule = parseSchedule(e.schedule, e.time, e.long_times).map((s) => `${s.when} ${s.what}`).join("\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//chirk//EN", "BEGIN:VEVENT",
    `UID:${e.id}@chirk`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`, ...when,
    `SUMMARY:${esc(e.title)}`, e.address ? `LOCATION:${esc(e.address)}` : "", schedule ? `DESCRIPTION:${esc(schedule)}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `inline; filename="${slug}.ics"` },
  });
}
