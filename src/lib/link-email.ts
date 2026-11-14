// "Your RSVP" email: what they said, when and where, and their private link (which also makes the device remember them). Pure.
import { listText, mapsUrl, when as whenText } from "./format.ts";
import type { Event } from "./types.ts";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type LinkEvent = Pick<Event, "title" | "date" | "time" | "end_time" | "place" | "address" | "long_times">;

export function linkEmail(i: {
  event: LinkEvent; names: string; going: boolean | null; parts: string[]; bringing: string[]; url: string; calendarUrl: string;
}) {
  const e = i.event;
  const status = i.going === null ? "You're invited, and haven't replied yet." : i.going ? "You're going." : "You can't make it.";
  const subject = i.going ? `You're going: ${e.title}` : `Your RSVP: ${e.title}`;
  const where = [e.place, e.address].filter(Boolean).join(" · ");
  const lines = [
    i.going && i.parts.length ? `Coming to: ${listText(i.parts)}` : null,
    i.going && i.bringing.length ? `Bringing: ${listText(i.bringing)}` : null,
  ].filter((l): l is string => !!l);
  const button = i.going === null ? "Reply now" : "See or change your reply";

  const text = [
    e.title, whenText(e), where, "", `${i.names}: ${status}`, ...lines, "",
    `${button}: ${i.url}`, ...(i.going ? [`Add to calendar: ${i.calendarUrl}`] : []), "",
    "This link is just for you (and anyone on your reply).",
  ].filter((l, n, a) => l || a[n - 1]).join("\n");

  const html = `<div style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">
<p style="margin:0;font-size:24px;font-weight:700;">${esc(e.title)}</p>
<p style="margin:4px 0 0;font-weight:600;">${esc(whenText(e))}</p>
${where ? `<p style="margin:2px 0 0;color:#78716c;">${e.address ? `<a href="${esc(mapsUrl(e.address))}" style="color:#78716c;">${esc(where)}</a>` : esc(where)}</p>` : ""}
<p style="margin:16px 0 0;"><strong>${esc(i.names)}</strong>: ${esc(status)}</p>
${lines.map((l) => `<p style="margin:4px 0 0;">${esc(l)}</p>`).join("")}
<p style="margin:20px 0 0;"><a href="${esc(i.url)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px;">${button}</a></p>
${i.going ? `<p style="margin:12px 0 0;"><a href="${esc(i.calendarUrl)}" style="color:inherit;font-weight:600;">Add to calendar</a></p>` : ""}
<p style="margin:16px 0 0;color:#78716c;font-size:14px;">This link is just for you (and anyone on your reply). Opening it on a phone or computer makes that device remember you.</p>
</div>`;
  return { subject, html, text };
}
