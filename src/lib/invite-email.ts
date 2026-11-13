// The invite as an email: subject, HTML (inline styles, so Gmail and Mail keep the look) and plain text.
// Pure: no database, no sending. Every value is escaped. The pattern follows crew-scheduler's email templates.
import { inline, parseDetails } from "./details.ts";
import { mapsUrl, shortDate, when as whenText } from "./format.ts";
import type { Event } from "./types.ts";

type InviteEvent = Pick<Event, "title" | "date" | "time" | "end_time" | "place" | "address" | "details" | "rsvp_by" | "cover_url">;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function inviteEmail(e: InviteEvent, url: string) {
  const when = whenText(e);
  const where = [e.place, e.address].filter(Boolean).join(" · ");
  const subject = `You're invited: ${e.title}`;
  const reply = e.rsvp_by ? `Please reply by ${shortDate(e.rsvp_by)}.` : null;

  const rich = (t: string) =>
    inline(t).map((p) =>
      p.href ? `<a href="${esc(p.href)}" style="color:#1c1917;">${esc(p.text)}</a>` : p.bold ? `<strong>${esc(p.text)}</strong>` : esc(p.text),
    ).join("");
  const details = parseDetails(e.details ?? "").map((block) =>
    block.map((l) =>
      l.kind === "heading" ? `<p style="margin:16px 0 4px;font-weight:700;">${esc(l.text)}</p>`
      : l.kind === "bullet" ? `<p style="margin:2px 0 2px 16px;">&bull;&nbsp; ${rich(l.text)}</p>`
      : `<p style="margin:2px 0;">${rich(l.text)}</p>`,
    ).join(""),
  ).map((b) => `<div style="margin:12px 0 0;">${b}</div>`).join("");

  const html = `<div style="max-width:560px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1c1917;font-size:16px;line-height:1.5;">
${e.cover_url ? `<img src="${esc(e.cover_url)}" alt="" style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px;">` : ""}
<p style="margin:16px 0 0;font-size:28px;line-height:1.15;font-weight:700;">${esc(e.title)}</p>
<p style="margin:8px 0 0;font-size:18px;font-weight:600;">${esc(when)}</p>
${where ? `<p style="margin:2px 0 0;color:#78716c;">${e.address ? `<a href="${esc(mapsUrl(e.address))}" style="color:#78716c;">${esc(where)}</a>` : esc(where)}</p>` : ""}
${details}
<p style="margin:24px 0 0;"><a href="${esc(url)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;">RSVP</a></p>
${reply ? `<p style="margin:12px 0 0;color:#78716c;">${esc(reply)}</p>` : ""}
</div>`;

  const detailsText = parseDetails(e.details ?? "").map((block) =>
    block.map((l) => (l.kind === "bullet" ? `- ${l.text}` : l.text).replace(/\*\*([^*]+)\*\*/g, "$1")).join("\n"),
  ).join("\n\n");
  const text = [e.title, when, where, "", detailsText, "", `RSVP: ${url}`, reply ?? ""].filter((l, i, a) => l || a[i - 1]).join("\n").trim();

  return { subject, html, text };
}
