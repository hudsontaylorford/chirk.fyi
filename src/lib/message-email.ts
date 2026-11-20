// "Message your guests": a note from the hosts to some of their guests, apart from the invite. Pure.
import { mapsUrl, when as whenText } from "./format.ts";
import { parseSchedule } from "./schedule.ts";
import type { Event } from "./types.ts";

import { button, esc, wrap } from "./email-parts.ts";

type MessageEvent = Pick<Event, "title" | "date" | "time" | "end_time" | "place" | "address" | "schedule" | "hosted_by" | "long_times">;

/** `details`: add the date, place and schedule under the note (for a day-before message). */
export function messageEmail(e: MessageEvent, names: string, note: string, url: string, details: boolean) {
  const subject = e.hosted_by ? `${e.title}: a note from ${e.hosted_by}` : `A note about ${e.title}`;
  const paras = note.trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const where = [e.place, e.address].filter(Boolean).join(" · ");
  const stages = details ? parseSchedule(e.schedule, e.time, e.long_times) : [];
  const sign = e.hosted_by ? `— ${e.hosted_by}` : null;

  const html = wrap(`<p style="margin:0;">Hi ${esc(names)},</p>
${paras.map((p) => `<p style="margin:12px 0 0;">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}
${sign ? `<p style="margin:12px 0 0;color:#78716c;">${esc(sign)}</p>` : ""}
${details ? `<div style="margin:20px 0 0;padding:12px 0;border-top:1px solid #e7e5e4;border-bottom:1px solid #e7e5e4;">
<p style="margin:0;font-weight:700;">${esc(e.title)}</p>
<p style="margin:2px 0 0;">${esc(whenText(e))}</p>
${where ? `<p style="margin:2px 0 0;">${e.address ? `<a href="${esc(mapsUrl(e.address))}" style="color:inherit;">${esc(where)}</a>` : esc(where)}</p>` : ""}
${stages.map((s) => `<p style="margin:2px 0 0;${s.main ? "font-weight:700;" : ""}">${esc(s.when)}&nbsp;&nbsp;${esc(s.what)}</p>`).join("")}
</div>` : ""}
${button(url, "See the invite")}`, 560);

  const text = [
    `Hi ${names},`, "", paras.join("\n\n"), ...(sign ? ["", sign] : []),
    ...(details ? ["", e.title, whenText(e), where, ...stages.map((s) => `${s.when}  ${s.what}`)].filter((l, i) => i === 0 || l !== "") : []),
    "", `See the invite: ${url}`,
  ].join("\n");
  return { subject, html, text };
}
