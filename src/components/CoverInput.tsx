"use client";

import { useState } from "react";
import { uploadPhoto } from "@/app/[slug]/host/actions";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { Cover } from "./Cover";

/** Cover photo: pick from the camera roll (shrunk on the phone, then uploaded), or paste a link. */
export function CoverInput({ value, canUpload }: { value: string | null; canUpload: boolean }) {
  const [url, setUrl] = useState(value ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setStatus("Shrinking…");
      const jpeg = await shrinkPhoto(file);
      setStatus("Uploading…");
      const f = new FormData();
      f.append("photo", new File([jpeg], "photo.jpg", { type: "image/jpeg" }));
      const res = await uploadPhoto(f);
      if ("error" in res) setStatus(res.error);
      else { setUrl(res.url); setStatus("Uploaded ✓ Tap Save to keep it."); }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="text-[15px] text-soft">Cover photo (optional)</span>
      <input type="hidden" name="cover_url" value={url} />
      {url && <div className="mt-2"><Cover src={url} host /></div>}
      {canUpload && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className={`btn btn-quiet bg-white px-4 text-[15px] ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
            {url ? "Change photo" : "Choose photo"}
            <input type="file" accept="image/jpeg,image/png,image/*" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {url && !busy && (
            <button type="button" className="text-[15px] text-soft underline" onClick={() => { setUrl(""); setStatus("Photo removed. Tap Save to keep the change."); }}>
              Remove
            </button>
          )}
        </div>
      )}
      {status && <p role="status" className="mt-1 text-[14px] text-soft">{status}</p>}
      <details className="mt-2" open={!canUpload}>
        <summary className="text-[14px] text-soft">{canUpload ? "Or use an image link" : "Image link"}</summary>
        <input className="field mt-1" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </details>
    </div>
  );
}
