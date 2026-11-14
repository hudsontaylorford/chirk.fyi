// "Sally is going": the note the host gets when someone replies (if the event's switch is on). Pure.
import { listText, several as many, shortDate } from "./format.ts";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function replyEmail(i: {
  title: string; date: string; names: string; going: boolean; adults: number; kids: number;
  parts: string[]; bringing: string[]; bringOn: boolean; note: string | null; changed: boolean;
  coming: number; waiting: number; hostUrl: string;
}) {
  const several = i.adults > 1 || many(i.names);
  const verb = i.going ? (i.changed ? "updated: going" : several ? "are going" : "is going") : "can't make it";
  const subject = `${i.names} ${verb}: ${i.title}`;
  // What they said, then where the event stands, so even a bare "going" says something useful.
  const lines = [
    i.going && i.kids ? `Plus ${i.kids} kid${i.kids === 1 ? "" : "s"}` : null,
    i.going && i.parts.length ? `Coming to: ${listText(i.parts)}` : null,
    i.going && i.bringOn ? (i.bringing.length ? `Bringing: ${listText(i.bringing)}` : "Not bringing anything yet") : null,
    i.note ? `Note: "${i.note}"` : null,
  ].filter((l): l is string => !!l);
  const tally = `That's ${i.coming} coming so far${i.waiting ? `, and ${i.waiting} ${i.waiting === 1 ? "invite hasn't" : "invites haven't"} replied yet` : ""}.`;
  const sub = `${i.title} · ${shortDate(i.date)}`;
  const text = [subject, sub, "", ...lines, ...(lines.length ? [""] : []), tally, "", `All replies: ${i.hostUrl}`].join("\n");
  const html = `<div style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">
<p style="margin:0;font-size:20px;font-weight:700;">${esc(i.names)} ${esc(verb)}</p>
<p style="margin:2px 0 0;color:#78716c;">${esc(sub)}</p>
${lines.map((l) => `<p style="margin:8px 0 0;">${esc(l)}</p>`).join("")}
<p style="margin:16px 0 0;color:#78716c;">${esc(tally)}</p>
<p style="margin:20px 0 0;"><a href="${esc(i.hostUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">See all replies</a></p>
</div>`;
  return { subject, html, text };
}
