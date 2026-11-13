import { getEvent } from "@/lib/data";

// "Add to calendar": a tiny .ics file the phone opens straight into Calendar.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getEvent(slug);
  if (!e) return new Response("Not found", { status: 404 });
  const day = e.date.replaceAll("-", "");
  const [h, m] = (e.time ?? "00:00").split(":").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = e.time
    ? [`DTSTART;TZID=America/New_York:${day}T${pad(h)}${pad(m)}00`, `DTEND;TZID=America/New_York:${day}T${pad(Math.min(h + 3, 23))}${pad(m)}00`]
    : [`DTSTART;VALUE=DATE:${day}`];
  const esc = (s: string) => s.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//chirk//EN", "BEGIN:VEVENT",
    `UID:${e.id}@chirk`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`, ...when,
    `SUMMARY:${esc(e.title)}`, e.address ? `LOCATION:${esc(e.address)}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `inline; filename="${slug}.ics"` },
  });
}
