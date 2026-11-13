"use client";

import { useEffect, useState } from "react";
import { inviteEmail } from "@/lib/invite-email";
import { imageLoads } from "./Cover";
import type { Event } from "@/lib/types";

/**
 * "Send the invite": Share (the phone's share sheet, for texts) and Copy invite for email
 * (the formatted invite on the clipboard as HTML plus plain text, for pasting into Gmail or Mail).
 */
export function CopyInvite({ event }: { event: Event }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  // Checked when the page opens: Safari only allows copying right at the tap, so nothing slow can happen then.
  const [coverOk, setCoverOk] = useState(false);
  useEffect(() => {
    if (event.cover_url) imageLoads(event.cover_url).then(setCoverOk);
  }, [event.cover_url]);
  const url = () => `${location.origin}/${event.slug}`;

  async function copy() {
    // A cover that doesn't load is left out, so the email never shows a broken image.
    const { html, text } = inviteEmail({ ...event, cover_url: coverOk ? event.cover_url : null }, url());
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) }),
      ]);
      setState("copied");
    } catch {
      // Older browsers: plain text still works.
      try { await navigator.clipboard.writeText(text); setState("copied"); } catch { setState("failed"); }
    }
    setTimeout(() => setState("idle"), 4000);
  }

  const [shared, setShared] = useState<"idle" | "copied">("idle");
  async function share() {
    // Phones open the share sheet (Messages, WhatsApp, AirDrop…); the link preview shows the invite.
    if (navigator.share) return navigator.share({ title: event.title, url: url() }).catch(() => {});
    await navigator.clipboard.writeText(url()).catch(() => {});
    setShared("copied");
    setTimeout(() => setShared("idle"), 3000);
  }

  return (
    <div className="rounded-2xl bg-wash p-4">
      <p className="text-[17px] font-semibold">Send the invite</p>
      <p className="text-[15px] text-soft">Text it to a group, or copy it into an email (the photo, details and RSVP button come along).</p>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={share} className="btn w-full text-[16px]">
          {shared === "copied" ? "Link copied ✓" : "Share invite (text, WhatsApp…)"}
        </button>
        <button type="button" onClick={copy} className="btn btn-quiet w-full border border-line bg-white text-[16px]">
          {state === "copied" ? "Copied ✓ Now paste it into an email" : state === "failed" ? "Couldn't copy" : "Copy invite for email"}
        </button>
      </div>
    </div>
  );
}
