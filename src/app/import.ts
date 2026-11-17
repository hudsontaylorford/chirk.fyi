"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { IMPORT_COOKIE, MAX_BYTES, sniffType, toAnswer } from "@/lib/import";
import { ImportProblem, readPlan } from "@/lib/import-ai";
import { allowRequest } from "@/lib/places";

const recent = new Map<string, number[]>();

/**
 * "Make it from a text or screenshot": reads what the host pasted or attached and opens New event filled in,
 * the same way a template does. Nothing is saved until they press Create event. The file is read, never stored.
 */
export async function importPlan(_prev: string | null, f: FormData): Promise<string> {
  const me = await currentUser();
  if (!me) return "Sign in first.";
  const text = String(f.get("text") ?? "").trim().slice(0, 8000);
  const upload = f.get("file");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  if (!text && !file) return "Paste something, or add a screenshot or PDF.";
  if (file && file.size > MAX_BYTES) return "That file is over 4 MB. Try a screenshot of just the part with the plan.";
  let attachment = null;
  if (file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffType(bytes.subarray(0, 16));
    if (!type) return "That file isn't a screenshot, photo or PDF.";
    attachment = { type, base64: Buffer.from(bytes).toString("base64") };
  }
  // shortcut: per server instance, best effort; the AI account's own spending limit is the hard cap
  if (!allowRequest(recent, me.id, Date.now(), 20, 60 * 60_000)) return "That's a lot of reading for one hour. Try again a bit later.";

  let plan;
  try {
    plan = await readPlan(text, attachment, new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }));
  } catch (e) {
    if (e instanceof ImportProblem) return e.message;
    throw e;
  }
  if (!Object.keys(plan.set).length && !plan.items.length) return "Couldn't find a plan in that. Try pasting more of it.";
  // Handed to New event in a short-lived cookie (this browser only), then read like a template.
  const answer = toAnswer(plan);
  let json = JSON.stringify(answer);
  if (json.length > 3500) json = JSON.stringify({ ...answer, message: answer.message.slice(0, 600) }); // a cookie holds about 4 KB
  (await cookies()).set(IMPORT_COOKIE, json, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/host/new", maxAge: 600 });
  redirect("/host/new?t=import");
}
