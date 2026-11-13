"use client";

import { useEffect, useState } from "react";
import { inviteEmail } from "@/lib/invite-email";
import { imageLoads } from "./Cover";
import type { Event } from "@/lib/types";

/**
 * "Copy invite for email": puts the formatted invite on the clipboard (HTML plus plain text),
 * so pasting into Gmail or Mail keeps the cover, details and RSVP button. No email service needed.
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

  return (
    <div className="rounded-2xl bg-wash p-4">
      <p className="text-[17px] font-semibold">Send the invite by email</p>
      <p className="text-[15px] text-soft">Copy it, then paste it into a new email. The photo, details and RSVP button come along.</p>
      <button type="button" onClick={copy} className="btn mt-3 w-full text-[16px]">
        {state === "copied" ? "Copied ✓ Now paste it into an email" : state === "failed" ? "Couldn't copy" : "Copy invite for email"}
      </button>
    </div>
  );
}
