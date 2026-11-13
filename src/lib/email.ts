// Sending email through Resend: one plain request, no SDK (crew-scheduler's pattern).
// Real email only goes out from the live site (Vercel production with RESEND_API_KEY).
// Locally, EMAIL_FAKE=true prints what would have been sent; otherwise nothing is sent.
import { headers } from "next/headers";

export type Email = { to: string; subject: string; html: string; text: string; idempotencyKey: string; replyTo?: string | null };

export async function sendEmail(e: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (process.env.VERCEL_ENV !== "production" || !key) {
    if (process.env.EMAIL_FAKE === "true") console.info(`[EMAIL_FAKE] To ${e.to}: ${e.subject}\n${e.text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": e.idempotencyKey },
      body: JSON.stringify({
        from: "chirk <invites@chirk.fyi>",
        to: [e.to],
        reply_to: e.replyTo || process.env.EMAIL_REPLY_TO || undefined,
        subject: e.subject, html: e.html, text: e.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error("Email not sent:", res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("Email not sent:", err);
    return false;
  }
}

/** This site's address, for links inside emails ("https://chirk.fyi"). */
export async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "chirk.fyi";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}
