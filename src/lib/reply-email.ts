// "Sally is going": the note the host gets when someone replies (if the event's switch is on). Pure.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function replyEmail(i: {
  title: string; names: string; going: boolean; adults: number; kids: number;
  bringing: string[]; note: string | null; changed: boolean; hostUrl: string;
}) {
  const verb = i.going ? (i.changed ? "updated: going" : "is going") : "can't make it";
  const subject = `${i.names} ${verb}: ${i.title}`;
  const party = i.going ? `${i.adults} adult${i.adults === 1 ? "" : "s"}${i.kids ? `, ${i.kids} kid${i.kids === 1 ? "" : "s"}` : ""}` : null;
  const lines = [
    party,
    i.going && i.bringing.length ? `Bringing: ${i.bringing.join(" and ")}` : null,
    i.note ? `Note: "${i.note}"` : null,
  ].filter((l): l is string => !!l);
  const text = [subject, "", ...lines, "", `All replies: ${i.hostUrl}`].join("\n");
  const html = `<div style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">
<p style="margin:0;font-size:20px;font-weight:700;">${esc(i.names)} ${esc(verb)}</p>
<p style="margin:2px 0 0;color:#78716c;">${esc(i.title)}</p>
${lines.map((l) => `<p style="margin:8px 0 0;">${esc(l)}</p>`).join("")}
<p style="margin:20px 0 0;"><a href="${esc(i.hostUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">See all replies</a></p>
</div>`;
  return { subject, html, text };
}
