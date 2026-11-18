"use client";

import { useActionState, useState } from "react";
import { importPlan } from "@/app/import";
import { shrinkPhoto } from "@/lib/shrink-photo";

// Vercel turns away anything over 4.5 MB before chirk sees it, so big files are shrunk or stopped here.
const MAX_SEND = 4 * 1024 * 1024;

/**
 * One quiet line on New event; tapped, a small composer (two lines, a paperclip, Fill in) so it never crowds the form.
 * The form below then fills itself in.
 */
export function ImportBox({ address }: { address: string | null }) {
  const [problem, read, reading] = useActionState(importPlan, null);
  const [file, setFile] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState<string | null>(null);
  const [shrinking, setShrinking] = useState(false);

  async function pick(input: HTMLInputElement) {
    const f = input.files?.[0];
    setTooBig(null);
    setFile(f?.name ?? null);
    if (!f) return;
    try {
      if (f.type.startsWith("image/") && f.size > 1024 * 1024) {
        // A Canva export can be 10 MB+; 1600px is still plenty to read the words.
        setShrinking(true);
        const jpeg = await shrinkPhoto(f);
        const dt = new DataTransfer();
        dt.items.add(new File([jpeg], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
        input.files = dt.files;
      } else if (f.size > MAX_SEND) throw new Error("That file is over 4 MB. Try a screenshot of just the part with the plan.");
    } catch (e) {
      input.value = "";
      setFile(null);
      setTooBig(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setShrinking(false);
    }
  }
  const shown = tooBig ?? problem;
  return (
    <details className="mt-1 text-[15px]" open={!!shown}>
      <summary className="cursor-pointer list-none text-soft underline underline-offset-2 [&::-webkit-details-marker]:hidden">Paste a text or screenshot</summary>
      <form action={read} className="mt-2">
        <div className="rounded-[14px] border-[1.5px] border-line bg-white focus-within:border-ink">
          <textarea
            name="text" rows={2} aria-label="Pasted text" placeholder="Paste a group text, an email, an invite…"
            className="block w-full resize-none rounded-[14px] bg-transparent px-4 pt-3 text-[17px] outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <label className="flex min-h-[44px] min-w-0 cursor-pointer items-center gap-1 rounded-full px-2 text-[15px] text-soft">
              <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5l-8.6 8.6a5 5 0 01-7.1-7.1l8.6-8.6a3.3 3.3 0 014.7 4.7l-8.6 8.6a1.7 1.7 0 01-2.4-2.4l7.9-7.9" />
              </svg>
              <span className="truncate">{file ?? "Add a screenshot or PDF"}</span>
              <input name="file" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => pick(e.currentTarget)} />
            </label>
            <button className="btn shrink-0 px-4 text-[15px]" style={{ minHeight: 40 }} disabled={reading || shrinking}>{reading ? "Reading…" : shrinking ? "Getting it ready…" : "Fill in"}</button>
          </div>
        </div>
        {shown
          ? <p role="alert" className="mt-1 text-[14px] text-red-700">{shown}</p>
          : <p className="mt-1 text-[14px] text-soft">Fills in the form below. Nothing is saved until you create the event.</p>}
        {address && <p className="mt-1 text-[14px] text-soft">Or forward an email to <strong className="font-semibold text-ink">{address}</strong> from your chirk email; it becomes a draft in Your events.</p>}
      </form>
    </details>
  );
}
