// Host sign-in. Hosts have accounts (an email, signed in with an emailed code); a signed cookie remembers them.
// The old shared password (ADMIN_PASSWORD) only remains to claim the events made before accounts existed.
import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

const SESSION = "host_session"; // not "chirk_…": those cookies are guests' replies
const LEGACY = "ek_host";
const YEAR = 60 * 60 * 24 * 365;

// The signing key: AUTH_SECRET if set, else the old password (so existing setups keep working).
const secret = () => process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export type User = { id: string; email: string; name: string | null };

/** The signed-in host, or null. */
export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(SESSION)?.value;
  if (!raw || !secret()) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig || !same(sig, sign(id))) return null;
  const [u] = await sql<User[]>`select id, email, name from users where id = ${id}`;
  return u ?? null;
}

export async function setSession(userId: string) {
  (await cookies()).set(SESSION, `${userId}.${sign(userId)}`, { ...cookieOpts, maxAge: YEAR });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION);
  jar.delete(LEGACY);
}

/** Signed in at all (any host account). */
export const isHost = async () => !!(await currentUser());

/** This user's role on an event ("owner" / "cohost"), or null if they don't host it. */
export async function hostRole(slug: string): Promise<"owner" | "cohost" | null> {
  const u = await currentUser();
  if (!u) return null;
  const [r] = await sql<{ role: "owner" | "cohost" }[]>`
    select h.role from event_hosts h join events e on e.id = h.event_id where e.slug = ${slug} and h.user_id = ${u.id}`;
  return r?.role ?? null;
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

// --- The old shared password: only for claiming events from before accounts. ---

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return pw.length > 0 && same(input, pw);
}
const legacyValue = () => createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update("event-kit-host").digest("hex");
export async function setLegacyCookie() {
  (await cookies()).set(LEGACY, legacyValue(), { ...cookieOpts, maxAge: 60 * 60 });
}
export async function clearLegacy() {
  (await cookies()).delete(LEGACY);
}
export async function hasLegacyCookie() {
  return !!process.env.ADMIN_PASSWORD && (await cookies()).get(LEGACY)?.value === legacyValue();
}
/** Events nobody hosts yet (made before accounts). While any exist, the old password can claim them. */
export async function unclaimedEvents() {
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from events e where not exists (select 1 from event_hosts h where h.event_id = e.id)`;
  return r.n;
}

// --- Emailed sign-in codes ---

export const hashCode = (email: string, code: string) => createHash("sha256").update(`${secret()}:${email}:${code}`).digest("hex");
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
