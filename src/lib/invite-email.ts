// The invite as an email: subject, HTML (inline styles, so Gmail and Mail keep the look) and plain text.
// Pure: no database, no sending. Every value is escaped. Text color is left to the mail app so dark mode reads well. The pattern follows crew-scheduler's email templates.
import { inline, parseDetails } from "./details.ts";
import { mapsUrl, shortDate, when as whenText } from "./format.ts";
import { reminderText } from "./guests.ts";
import { parseSchedule } from "./schedule.ts";
import type { Event } from "./types.ts";

type InviteEvent = Pick<Event, "title" | "date" | "time" | "end_time" | "place" | "address" | "details" | "rsvp_by" | "cover_url"> & { long_times?: boolean; schedule?: string | null; hosted_by?: string | null };

import { button, esc, meHtml, meLine, wrap } from "./email-parts.ts";

/** `greeting`: the guest's names on a personal invite ("Hi Sam, you're invited!" above the title). `meUrl`: chirk.fyi/me, only on invites chirk sends to a guest's own email. */
export function inviteEmail(e: InviteEvent, url: string, greeting?: string, meUrl?: string) {
  const when = whenText(e);
  const where = [e.place, e.address].filter(Boolean).join(" · ");
  const subject = `You're invited: ${e.title}`;
  const stages = parseSchedule(e.schedule ?? null, e.time, e.long_times);
  const sign = e.hosted_by ? (e.details ? `— ${e.hosted_by}` : `Hosted by ${e.hosted_by}`) : null;
  // Said once, beside the button: replying takes no account.
  const reply = [e.rsvp_by && `Please reply by ${shortDate(e.rsvp_by)}.`, "No account needed."].filter(Boolean).join(" ");

  const rich = (t: string) =>
    inline(t).map((p) =>
      p.href ? `<a href="${esc(p.href)}" style="color:inherit;${p.bold ? "font-weight:700;" : ""}">${esc(p.text)}</a>` : p.bold ? `<strong>${esc(p.text)}</strong>` : esc(p.text),
    ).join("");
  const details = parseDetails(e.details ?? "").map((block) =>
    block.map((l) =>
      l.kind === "heading" ? `<p style="margin:16px 0 4px;font-weight:700;">${esc(l.text)}</p>`
      : l.kind === "bullet" ? `<p style="margin:2px 0 2px 16px;">&bull;&nbsp; ${rich(l.text)}</p>`
      : `<p style="margin:2px 0;">${rich(l.text)}</p>`,
    ).join(""),
  ).map((b) => `<div style="margin:12px 0 0;">${b}</div>`).join("");

  const html = wrap(`${greeting ? `<p style="margin:0 0 12px;font-size:18px;">Hi ${esc(greeting)}, you're invited!</p>` : ""}
${e.cover_url ? `<img src="${esc(e.cover_url)}" alt="" style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px;">` : ""}
<p style="margin:16px 0 0;font-size:28px;line-height:1.15;font-weight:700;">${esc(e.title)}</p>
<p style="margin:8px 0 0;font-size:18px;font-weight:600;">${esc(when)}</p>
${where ? `<p style="margin:2px 0 0;color:#78716c;">${e.address ? `<a href="${esc(mapsUrl(e.address))}" style="color:#78716c;">${esc(where)}</a>` : esc(where)}</p>` : ""}
${stages.length ? `<div style="margin:12px 0 0;">${stages.map((s) => `<p style="margin:2px 0;${s.main ? "font-weight:700;" : ""}"><span style="${s.main ? "" : "color:#78716c;"}">${esc(s.when)}</span>&nbsp;&nbsp;${esc(s.what)}</p>`).join("")}</div>` : ""}
${details}
${sign ? `<p style="margin:12px 0 0;color:#78716c;">${esc(sign)}</p>` : ""}
${button(url, "RSVP", 24)}
<p style="margin:12px 0 0;color:#78716c;">${esc(reply)}</p>
${meUrl ? meHtml(meUrl) : ""}`, 560);

  const detailsText = parseDetails(e.details ?? "").map((block) =>
    block.map((l) => (l.kind === "bullet" ? `- ${l.text}` : l.text).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]\n]+)\] ?\(((?:https?:\/\/|www\.)[^\s)]+)\)/g, "$1 ($2)")).join("\n"),
  ).join("\n\n");
  const scheduleText = stages.map((s) => `${s.when}  ${s.what}`).join("\n");
  const text = [greeting ? `Hi ${greeting}, you're invited!\n` : "", e.title, when, where, scheduleText, "", detailsText, sign ?? "", "", `RSVP: ${url}`, reply, meUrl ? `\n${meLine(meUrl)}` : ""].filter((l, i, a) => l || a[i - 1]).join("\n").trim();

  return { subject, html, text };
}

/** "Can you make it?": a short email to someone on the guest list who hasn't answered yet. */
export function reminderEmail(e: InviteEvent, url: string, names: string) {
  const line = reminderText(e, names);
  const subject = `Can you make ${e.title}?`;
  const html = wrap(`<p style="margin:0;">${esc(line)}</p>
${button(url, "RSVP")}`, 560);
  return { subject, html, text: `${line}\n\nRSVP: ${url}` };
}
