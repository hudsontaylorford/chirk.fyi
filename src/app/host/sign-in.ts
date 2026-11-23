"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword, clearLegacy, clearSession, hasLegacyCookie, hashCode, newCode, requireUser, setLegacyCookie, setSession,
} from "@/lib/auth";
import { codeEmail } from "@/lib/code-email";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { TERMS_VERSION } from "@/lib/terms";

export type SignInState = { email: string; step: "email" | "code"; message: string | null };

const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase().slice(0, 200);
const looksLikeEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** chirk is invite only: an account is for someone already a host, or on some event's guest list or replies. */
async function invited(email: string) {
  if (await hasLegacyCookie()) return true; // setting up the first account, after the old password
  const [r] = await sql`
    select 1 from users where email = ${email}
    union all select 1 from households where lower(email) = ${email} limit 1`;
  return !!r;
}

/**
 * Step 1: email a 6-digit code. The answer is the same whether or not the email is invited,
 * so the page never reveals who's on anyone's list. One code per email per 30 seconds.
 */
export async function sendCode(_prev: SignInState, f: FormData): Promise<SignInState> {
  const email = clean(f.get("email"));
  if (!looksLikeEmail(email)) return { email, step: "email", message: "That email doesn't look right." };
  if (await invited(email)) {
    const [recent] = await sql`select 1 from login_codes where email = ${email} and created_at > now() - interval '30 seconds'`;
    if (!recent) {
      const code = newCode();
      await sql`
        insert into login_codes (email, code_hash, expires_at) values (${email}, ${hashCode(email, code)}, now() + interval '10 minutes')
        on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = now()`;
      await sendEmail({ to: email, ...codeEmail(code), idempotencyKey: `code-${email}-${Math.floor(Date.now() / 30_000)}` });
    }
  }
  return { email, step: "code", message: "If that email has been invited to a chirk event, a code is on its way. It works for 10 minutes." };
}

/** Step 2: check the code, then sign in (making the account the first time). */
export async function verifyCode(_prev: SignInState, f: FormData): Promise<SignInState> {
  const email = clean(f.get("email"));
  const code = String(f.get("code") ?? "").replace(/\D/g, "");
  const wrong = { email, step: "code" as const, message: "That code didn't work. Check it, or tap Use a different email to get a new one." };
  // Local testing only: a fixed code, never on the live site.
  const testCode = !process.env.VERCEL && process.env.LOGIN_TEST_CODE; // never on any Vercel deploy, previews included
  if (testCode && code === testCode) {
    if (!(await invited(email))) return wrong;
  } else {
    // Counts the try and checks the limit in one step, so a burst of guesses can't all slip under it.
    const [row] = await sql<{ code_hash: string }[]>`
      update login_codes set attempts = attempts + 1 where email = ${email} and attempts < 5 and expires_at > now() returning code_hash`;
    if (!row) return { ...wrong, message: "That code has expired. Send a new one." };
    if (row.code_hash !== hashCode(email, code)) return wrong;
    // Used once: only the request that deletes it signs in.
    const [used] = await sql`delete from login_codes where email = ${email} and code_hash = ${row.code_hash} returning 1`;
    if (!used) return wrong;
  }

  const [user] = await sql<{ id: string }[]>`
    insert into users (email, terms_version, terms_accepted_at) values (${email}, ${TERMS_VERSION}, now())
    on conflict (email) do update set terms_version = excluded.terms_version, terms_accepted_at = excluded.terms_accepted_at
    returning id`;
  // First account after the old password: every event from before accounts becomes theirs.
  if (await hasLegacyCookie()) {
    await sql`insert into event_hosts (event_id, user_id, role)
      select e.id, ${user.id}, 'owner' from events e where not exists (select 1 from event_hosts h where h.event_id = e.id)`;
  }
  await clearLegacy();
  await setSession(user.id);
  redirect("/host");
}

/** The old shared password, only while events from before accounts are unclaimed. */
export async function legacySignIn(f: FormData) {
  if (!checkPassword(String(f.get("password") ?? ""))) redirect("/host?wrong=1");
  await setLegacyCookie();
  redirect("/host");
}

export async function saveName(f: FormData) {
  const u = await requireUser();
  const name = String(f.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (name) await sql`update users set name = ${name} where id = ${u.id}`;
  revalidatePath("/host");
}

/** "Got it" on the Terms note, for hosts who signed in before the current Terms. */
export async function acceptTerms() {
  const u = await requireUser();
  await sql`update users set terms_version = ${TERMS_VERSION}, terms_accepted_at = now() where id = ${u.id}`;
  revalidatePath("/host");
}

/** With an `email` (a co-host link for another address), lands on sign-in with it filled in. */
export async function signOut(f?: FormData) {
  await clearSession();
  const email = clean(f?.get("email") ?? null);
  redirect(email ? `/host?email=${encodeURIComponent(email)}` : "/");
}
