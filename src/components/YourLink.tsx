"use client";

import { useEffect, useState } from "react";

/** The guest's private edit link, with Share (phone share sheet) and Copy. */
export function YourLink({ slug, token }: { slug: string; token: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setUrl(`${location.origin}/${slug}/r/${token}`);
  }, [slug, token]);

  async function share() {
    if (navigator.share) return navigator.share({ title: "My RSVP", url }).catch(() => {});
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-wash p-4">
      <p className="font-semibold">This is your link</p>
      <p className="mt-0.5 text-[15px] text-soft">This phone remembers your reply. On another phone, use this link. It works for everyone in your RSVP.</p>
      <button type="button" onClick={share} className="btn mt-3 w-full">
        {copied ? "Copied ✓" : "Save my link"}
      </button>
    </div>
  );
}

/** Host view: copy someone's private link to send them. */
export function CopyLink({ path, label = "Copy link" }: { path: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button" className="font-semibold underline underline-offset-2"
      onClick={async () => {
        await navigator.clipboard.writeText(location.origin + path).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}
