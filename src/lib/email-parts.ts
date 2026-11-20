// The pieces every chirk email shares: escaping, the page wrapper and the one button. Pure.
// The button matches the site's primary (ink, 8px corners); the white border keeps it visible in dark mail apps.
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const wrap = (inner: string, width = 520) =>
  `<div style="max-width:${width}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;">${inner}</div>`;

export const button = (href: string, label: string, margin = 20) =>
  `<p style="margin:${margin}px 0 0;"><a href="${esc(href)}" style="display:inline-block;background:#1c1917;color:#ffffff;border:2px solid #ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">${esc(label)}</a></p>`;

/** The footer line on emails to a guest's own address (fact 3: every invite in one place). */
export const meLine = (meUrl: string) => `Every invite you get, in one place: ${meUrl}`;
export const meHtml = (meUrl: string, margin = 24) =>
  `<p style="margin:${margin}px 0 0;color:#78716c;font-size:14px;">Every invite you get, in one place: <a href="${esc(meUrl)}" style="color:#78716c;">${esc(meUrl.replace(/^https?:\/\//, ""))}</a></p>`;
