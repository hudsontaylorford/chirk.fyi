// "You're giving to Sam": each gift-exchange giver's private match. Pure.
import { button, esc, wrap } from "./email-parts.ts";

export function giftEmail(i: { title: string; giver: string; receiver: string; budget: string | null; wish: string | null; url: string }) {
  const subject = `Your gift exchange match: ${i.title}`;
  const lines = [i.budget ? `Budget: ${i.budget}` : null, i.wish ? `Their ideas: ${i.wish}` : null].filter((l): l is string => !!l);
  const text = [`Hi ${i.giver},`, "", `For ${i.title}, you're giving a gift to ${i.receiver}. Keep it a secret!`, ...lines, "", `See it any time: ${i.url}`].join("\n");
  const html = wrap(`<p style="margin:0;">Hi ${esc(i.giver)},</p>
<p style="margin:12px 0 0;">For ${esc(i.title)}, you're giving a gift to</p>
<p style="margin:4px 0 0;font-size:26px;font-weight:700;">${esc(i.receiver)}</p>
<p style="margin:4px 0 0;color:#78716c;">Keep it a secret!</p>
${lines.map((l) => `<p style="margin:8px 0 0;">${esc(l)}</p>`).join("")}
${button(i.url, "See it any time")}`);
  return { subject, html, text };
}


/** "Names are drawn Dec 1: add your gift ideas." Sent 3 days before the draw. */
export function giftIdeasEmail(i: { title: string; names: string; drawOn: string; url: string }) {
  const line = `Names for the ${i.title} gift exchange are drawn on ${i.drawOn}. Add a few gift ideas so whoever draws you knows what you'd love.`;
  return {
    subject: `Add your gift ideas: ${i.title}`,
    text: `Hi ${i.names},\n\n${line}\n\nAdd your ideas: ${i.url}`,
    html: wrap(`<p style="margin:0;">Hi ${esc(i.names)},</p><p style="margin:12px 0 0;">${esc(line)}</p>${button(i.url, "Add your ideas")}`),
  };
}

/** "Thanksgiving is next week: you're giving to Sam." Sent a week before the event. */
export function giftGiverEmail(i: { title: string; giver: string; receiver: string; budget: string | null; wish: string | null; when: string; url: string }) {
  const lines = [i.budget ? `Budget: ${i.budget}` : null, i.wish ? `Their ideas: ${i.wish}` : null].filter((l): l is string => !!l);
  return {
    subject: `${i.title} is coming up: your gift for ${i.receiver}`,
    text: [`Hi ${i.giver},`, "", `${i.title} is ${i.when}. A reminder: you're giving a gift to ${i.receiver}.`, ...lines, "", `See it any time: ${i.url}`].join("\n"),
    html: wrap(`<p style="margin:0;">Hi ${esc(i.giver)},</p>
<p style="margin:12px 0 0;">${esc(i.title)} is ${esc(i.when)}. A reminder: you're giving a gift to</p>
<p style="margin:4px 0 0;font-size:26px;font-weight:700;">${esc(i.receiver)}</p>
${lines.map((l) => `<p style="margin:8px 0 0;">${esc(l)}</p>`).join("")}${button(i.url, "See it any time")}`),
  };
}
