import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { siteUrl } from "@/lib/email";

// Personal links land here (emailed reply links, and named guests' invites with ?to=invite): remember this device's reply (the same cookie a new RSVP sets), then show it.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  const [ok] = await sql`select 1 from households h join events e on e.id = h.event_id where e.slug = ${slug} and h.token = ${token}`;
  const toInvite = new URL(req.url).searchParams.get("to") === "invite";
  // The site's own address (not the server's internal one), so the cookie and the page share a host.
  const res = NextResponse.redirect(new URL(ok && !toInvite ? `/${slug}/r/${token}` : `/${slug}`, await siteUrl()));
  if (ok) {
    res.cookies.set(`chirk_${slug}`, token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
