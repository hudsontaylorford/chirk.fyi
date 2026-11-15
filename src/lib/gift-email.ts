// "You're giving to Sam": each gift-exchange giver's private match. Pure.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function giftEmail(i: { title: string; giver: string; receiver: string; budget: string | null; wish: string | null; url: string }) {
  const subject = `Your gift exchange match: ${i.title}`;
  const lines = [i.budget ? `Budget: ${i.budget}` : null, i.wish ? `Their ideas: ${i.wish}` : null].filter((l): l is string => !!l);
  const text = [`Hi ${i.giver},`, "", `For ${i.title}, you're giving a gift to ${i.receiver}. Keep it a secret!`, ...lines, "", `See it any time: ${i.url}`].join("\n");
  const html = `<div style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">
<p style="margin:0;">Hi ${esc(i.giver)},</p>
<p style="margin:12px 0 0;">For ${esc(i.title)}, you're giving a gift to</p>
<p style="margin:4px 0 0;font-size:26px;font-weight:700;">${esc(i.receiver)}</p>
<p style="margin:4px 0 0;color:#78716c;">Keep it a secret!</p>
${lines.map((l) => `<p style="margin:8px 0 0;">${esc(l)}</p>`).join("")}
<p style="margin:20px 0 0;"><a href="${esc(i.url)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">See it any time</a></p>
</div>`;
  return { subject, html, text };
}
