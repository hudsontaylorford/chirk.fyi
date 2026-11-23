"use client";

import { useEffect, useState } from "react";
import { photoForColor, uploadPhoto } from "@/app/[slug]/host/actions";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { Cover } from "./Cover";
import { mainColor } from "@/lib/theme";

/** Cover photo: pick from the camera roll (shrunk on the phone, then uploaded), or paste a link. */
export function CoverInput({ value, theme, canUpload }: { value: string | null; theme: string | null; canUpload: boolean }) {
  const [url, setUrl] = useState(value ?? "");
  const [match, setMatch] = useState(!!theme);
  const [broken, setBroken] = useState(false); // a link that isn't a picture: nothing to match
  const [status, setStatus] = useState<string | null>(null);
  // The color read for a photo (null = it has none). A new photo is read again; an uploaded one is read on the phone before upload.
  const [read, setRead] = useState<{ url: string; color: string | null }>({ url: value ?? "", color: theme });
  const color = read.url === url ? read.color ?? "" : "";
  useEffect(() => {
    if (!match || !url || read.url === url) return;
    let live = true;
    setStatus("Reading the photo’s color…");
    // Straight from the link when its site allows it; otherwise through chirk's server (Pinterest, Google).
    photoColor(url)
      .catch(async () => { const copy = await photoForColor(url); if (!copy) throw new Error(); return photoColor(copy); })
      .then((c) => {
        if (!live) return;
        setRead({ url, color: c });
        setStatus(c ? "Color matched ✓ Tap Save to keep it." : "This photo has no clear color, so the invite stays plain.");
      }, () => {
        if (!live) return;
        setMatch(false); // untick now, with the reason beside it, so Save doesn't look like it lost the setting
        setStatus("Couldn’t read this photo’s color, so the box is unticked. Save the image and upload it instead to match it.");
      });
    return () => { live = false; };
  }, [match, url, read.url]);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setStatus("Shrinking…");
      const jpeg = await shrinkPhoto(file);
      const local = URL.createObjectURL(jpeg);
      const c = await photoColor(local).catch(() => null);
      URL.revokeObjectURL(local);
      setStatus("Uploading…");
      const f = new FormData();
      f.append("photo", new File([jpeg], "photo.jpg", { type: "image/jpeg" }));
      const res = await uploadPhoto(f);
      if ("error" in res) setStatus(res.error);
      else { setRead({ url: res.url, color: c }); setUrl(res.url); setStatus("Uploaded ✓ Tap Save to keep it."); }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="sr-only">Cover photo</span>
      <input type="hidden" name="cover_url" value={url} />
      {url && <div className="mt-2"><Cover src={url} host onBroken={setBroken} /></div>}
      {canUpload && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className={`button-quiet text-[15px] ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
            {url ? "Change photo" : "Choose photo"}
            <input type="file" accept="image/jpeg,image/png,image/*" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {url && !busy && (
            <button type="button" className="tap text-[15px] text-soft underline underline-offset-2" onClick={() => { setUrl(""); setStatus("Photo removed. Tap Save to keep the change."); }}>
              Remove
            </button>
          )}
        </div>
      )}
      {url && !broken && (
        <label className="mt-2 flex items-center gap-3 py-1 text-[16px]">
          <input type="checkbox" checked={match} onChange={(e) => setMatch(e.target.checked)} className="h-5 w-5 shrink-0" />
          Match the invite’s color to the photo
          {match && color && <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border border-line" style={{ background: color }} />}
        </label>
      )}
      <input type="hidden" name="theme" value={match ? color : ""} />
      {status && <p role="status" className="mt-1 text-[14px] text-soft">{status}</p>}
      <details className="mt-2" open={!canUpload}>
        <summary className="text-[14px] text-soft">{canUpload ? "Or use an image link" : "Image link"}</summary>
        <input className="field mt-1" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <span className="text-[14px] text-soft">The picture&apos;s own address: press and hold it, then Copy Image Address.</span>
      </details>
    </div>
  );
}

/** The photo's main color, read from a 24×24 copy. A link works only if its site allows it (many, like Pinterest, don't). */
async function photoColor(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 24, 24);
  return mainColor(ctx.getImageData(0, 0, 24, 24).data);
}
