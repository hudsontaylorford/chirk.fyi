import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ek_host";

function expected() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("event-kit-host").digest("hex");
}

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const a = Buffer.from(input), b = Buffer.from(pw);
  return pw.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export async function isHost() {
  const want = expected();
  if (!want) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === want;
}

export async function setHostCookie() {
  const jar = await cookies();
  jar.set(COOKIE, expected()!, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearHostCookie() {
  (await cookies()).delete(COOKIE);
}

export async function requireHost() {
  if (!(await isHost())) throw new Error("Not signed in as host");
}
