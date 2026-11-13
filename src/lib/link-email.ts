// "Your RSVP" email: the guest's private link, which also makes the device remember them. Pure.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function linkEmail(i: { title: string; names: string; going: boolean; bringing: string[]; url: string }) {
  const status = i.going ? "You're going." : "You can't make it.";
  const bring = i.going && i.bringing.length ? `Bringing: ${i.bringing.join(" and ")}` : null;
  const subject = `Your RSVP: ${i.title}`;
  const text = [i.title, `${i.names}: ${status}`, bring ?? "", "", `See or change your reply: ${i.url}`, "", "This link is just for you (and anyone on your reply)."]
    .filter((l, n, a) => l || a[n - 1]).join("\n");
  const html = `<div style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">
<p style="margin:0;font-size:24px;font-weight:700;">${esc(i.title)}</p>
<p style="margin:8px 0 0;"><strong>${esc(i.names)}</strong>: ${esc(status)}</p>
${bring ? `<p style="margin:4px 0 0;">${esc(bring)}</p>` : ""}
<p style="margin:20px 0 0;"><a href="${esc(i.url)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px;">See or change your reply</a></p>
<p style="margin:16px 0 0;color:#78716c;font-size:14px;">This link is just for you (and anyone on your reply). Opening it on a phone or computer makes that device remember you.</p>
</div>`;
  return { subject, html, text };
}
