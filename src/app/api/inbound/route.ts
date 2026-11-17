import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendEmail, siteUrl } from "@/lib/email";
import { forwardEmail } from "@/lib/code-email";
import { addHostAsGuest, freeSlug, saveList } from "@/lib/event-setup";
import { MAX_BYTES, sniffType, type FileType } from "@/lib/import";
import { ImportProblem, readPlan } from "@/lib/import-ai";
import { htmlToText, senderAddress, verifyWebhook } from "@/lib/inbound";

export const maxDuration = 60;

/**
 * "Forward an email to chirk". Resend receives mail at the forwarding address and posts here (`email.received`).
 * Only a chirk account's own email address counts as a sender; the email becomes a DRAFT in that host's events
 * (nothing is sent to guests), and the host gets an email with the link. The email is read once, never stored.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const h = req.headers;
  if (!verifyWebhook(process.env.RESEND_WEBHOOK_SECRET ?? "", h.get("webhook-id"), h.get("webhook-timestamp"), raw, h.get("webhook-signature"), Math.floor(Date.now() / 1000))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { type?: string; data?: { email_id?: string; from?: string; subject?: string } };
  const d = event.data;
  if (event.type !== "email.received" || !d?.email_id || !d.from) return NextResponse.json({ ok: true });

  const from = senderAddress(d.from);
  const [user] = from ? await sql<{ id: string; email: string; name: string | null }[]>`select id, email, name from users where email = ${from}` : [];
  if (!user) return NextResponse.json({ ok: true, ignored: "not a chirk account" }); // no reply: never answer strangers

  // Claimed once, so a repeated notice can't make a second draft.
  const [claimed] = await sql`insert into inbound_emails (email_id, user_id) values (${d.email_id}, ${user.id}) on conflict do nothing returning 1`;
  if (!claimed) return NextResponse.json({ ok: true, duplicate: true });

  const tell = (i: Parameters<typeof forwardEmail>[0]) => sendEmail({ to: user.email, ...forwardEmail(i), idempotencyKey: `forward-${d.email_id}` });
  try {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from inbound_emails where user_id = ${user.id} and created_at > now() - interval '1 day'`;
    if (n > 20) { await tell({ title: null, url: null, noDate: false, problem: "That's more than 20 forwarded emails today, so this one wasn't read." }); return NextResponse.json({ ok: true }); }

    const { text, file } = await readEmail(d.email_id, d.subject ?? "");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    let plan;
    try {
      plan = await readPlan(text, file, today, user.name || user.email.split("@")[0]);
    } catch (e) {
      if (e instanceof ImportProblem) { await tell({ title: null, url: null, noDate: false, problem: e.message }); return NextResponse.json({ ok: true }); }
      throw e;
    }
    if (!Object.keys(plan.set).length && !plan.items.length) { await tell({ title: null, url: null, noDate: false, problem: null }); return NextResponse.json({ ok: true }); }

    const s = plan.set;
    const title = s.title || d.subject?.replace(/^(fwd?|fw):\s*/i, "").slice(0, 80) || "Forwarded plan";
    const fields = {
      title, date: s.date ?? today, time: s.time ?? null, end_time: s.end_time ?? null, place: s.place ?? null, address: s.address ?? null,
      hosted_by: s.hosted_by ?? null, details: s.details ?? null, schedule: s.schedule ?? null, bring_prompt: s.bring_prompt ?? null, status: "draft",
    };
    const slug = await freeSlug(title);
    const [e] = await sql<{ id: string }[]>`insert into events ${sql({ ...fields, slug })} returning id`;
    await sql`insert into event_hosts (event_id, user_id, role) values (${e.id}, ${user.id}, 'owner')`;
    await addHostAsGuest(e.id, user);
    await saveList(e.id, plan.items);
    await sql`update inbound_emails set event_id = ${e.id} where email_id = ${d.email_id}`;
    await tell({ title, url: `${await siteUrl()}/${slug}/host`, noDate: !s.date, problem: null });
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    // Let Resend try again later: release the claim.
    await sql`delete from inbound_emails where email_id = ${d.email_id} and event_id is null`;
    console.error("inbound email failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

/** The email's text (and its first screenshot or PDF), fetched from Resend; the webhook itself carries only the subject. */
async function readEmail(id: string, subject: string): Promise<{ text: string; file: { type: FileType; base64: string } | null }> {
  // Local tests: no Resend account, so the subject stands in for the whole email.
  if (process.env.EMAIL_FAKE === "true" && process.env.VERCEL_ENV !== "production") return { text: subject, file: null };
  const api = (path: string) => fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, cache: "no-store" });
  const res = await api(`/emails/receiving/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Resend ${res.status} fetching the received email`);
  const m = (await res.json()) as { text: string | null; html: string | null; attachments?: { id: string; size: number; content_type: string }[] };
  const body = (m.text || (m.html ? htmlToText(m.html) : "")).slice(0, 8000);
  let file = null;
  const att = m.attachments?.find((a) => (/^image\//.test(a.content_type) || a.content_type === "application/pdf") && a.size <= MAX_BYTES);
  if (att) {
    const meta = await api(`/emails/receiving/${encodeURIComponent(id)}/attachments/${encodeURIComponent(att.id)}`);
    const url = meta.ok ? ((await meta.json()) as { download_url?: string }).download_url : undefined;
    const bytes = url ? new Uint8Array(await (await fetch(url, { cache: "no-store" })).arrayBuffer()) : null;
    const type = bytes ? sniffType(bytes.subarray(0, 16)) : null;
    if (bytes && type && bytes.length <= MAX_BYTES) file = { type, base64: Buffer.from(bytes).toString("base64") };
  }
  return { text: `Subject: ${subject}\n\n${body}`, file };
}
