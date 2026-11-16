// The sign-in code email, and the "you've been added as a co-host" email. Pure.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const wrap = (inner: string) => `<div style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">${inner}</div>`;
const button = (href: string, label: string) =>
  `<p style="margin:20px 0 0;"><a href="${esc(href)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;">${esc(label)}</a></p>`;

export function codeEmail(code: string) {
  const subject = `Your chirk code: ${code}`;
  const text = `Your chirk sign-in code is ${code}. It works for 10 minutes.\n\nIf you didn't ask for it, you can ignore this email.`;
  const html = wrap(`<p style="margin:0;">Your chirk sign-in code:</p>
<p style="margin:8px 0 0;font-size:32px;font-weight:700;letter-spacing:4px;">${esc(code)}</p>
<p style="margin:8px 0 0;color:#78716c;">It works for 10 minutes. If you didn't ask for it, you can ignore this email.</p>`);
  return { subject, html, text };
}

export function cohostEmail(i: { by: string; title: string; url: string }) {
  const subject = `${i.by} added you as a co-host: ${i.title}`;
  const text = `${i.by} added you as a co-host of ${i.title} on chirk. Sign in with this email to see replies, edit the event and send invites.\n\nOpen chirk: ${i.url}`;
  const html = wrap(`<p style="margin:0;"><strong>${esc(i.by)}</strong> added you as a co-host of <strong>${esc(i.title)}</strong> on chirk.</p>
<p style="margin:8px 0 0;">Sign in with this email to see replies, edit the event and send invites.</p>
${button(i.url, "Open chirk")}`);
  return { subject, html, text };
}
