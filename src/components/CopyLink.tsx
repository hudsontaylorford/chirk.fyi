"use client";

import { useEffect, useState } from "react";

/** Shows a guest's personal edit link with copy / share buttons. */
export function CopyLink({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(window.location.origin + path);
    setCanShare(typeof navigator.share === "function");
  }, [path]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.getElementById("edit-link") as HTMLInputElement | null;
      el?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div>
      <input
        id="edit-link"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="field font-mono text-[14px]"
        aria-label="Your personal link"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn btn-primary flex-1">
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title, text: `My RSVP for ${title}`, url }).catch(() => {})}
            className="btn btn-ghost flex-1 text-maroon"
          >
            Text it to myself
          </button>
        )}
      </div>
    </div>
  );
}
