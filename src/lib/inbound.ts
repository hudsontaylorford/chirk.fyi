// "Forward an email to chirk": the plain parts (no network), unit-tested.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Resend signs each webhook the Standard Webhooks way (the `standardwebhooks` package Resend's SDK uses):
 * HMAC-SHA256 of "<webhook-id>.<webhook-timestamp>.<raw body>" with the base64 key after "whsec_",
 * sent as "v1,<base64>" (several may be space-separated). Older than 5 minutes is refused.
 */
export function verifyWebhook(secret: string, id: string | null, timestamp: string | null, body: string, signatures: string | null, nowSeconds: number): boolean {
  if (!secret.startsWith("whsec_") || !id || !timestamp || !signatures) return false;
  const ts = Number(timestamp);
  if (!Number.isInteger(ts) || Math.abs(nowSeconds - ts) > 5 * 60) return false;
  const expected = createHmac("sha256", Buffer.from(secret.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest();
  return signatures.split(" ").some((s) => {
    const [version, sig] = s.split(",");
    const got = Buffer.from(sig ?? "", "base64");
    return version === "v1" && got.length === expected.length && timingSafeEqual(got, expected);
  });
}

/** "Hudson Ford <Hudson@Example.com>" → "hudson@example.com". */
export function senderAddress(from: string): string | null {
  const m = from.match(/<([^<>\s]+@[^<>\s]+)>/) ?? from.match(/([^\s<>"]+@[^\s<>"]+)/);
  return m ? m[1].toLowerCase() : null;
}

/** Readable text from an email's HTML, for emails without a text part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}
