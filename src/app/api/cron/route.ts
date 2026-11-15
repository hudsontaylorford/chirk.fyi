import { siteUrl } from "@/lib/email";
import { runDue } from "@/lib/jobs";

export const dynamic = "force-dynamic";

/**
 * The morning job (vercel.json runs it daily at 9 am New York time in winter, 10 am in summer).
 * Vercel sends "Authorization: Bearer <CRON_SECRET>"; anything else is turned away.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Not allowed", { status: 401 });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
  const done = await runDue(today, await siteUrl());
  return Response.json({ today, done });
}
