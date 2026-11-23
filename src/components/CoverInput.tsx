"use client";

import { useEffect, useState } from "react";
import { photoForColor, uploadPhoto } from "@/app/[slug]/host/actions";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { Cover } from "./Cover";
import { accentColor, mainColor } from "@/lib/theme";

/** Cover photo: pick from the camera roll (shrunk on the phone, then uploaded), or paste a link. */
export function CoverInput({ value, theme, canUpload }: { value: string | null; theme: string | null; canUpload: boolean }) {
  const [url, setUrl] = useState(value ?? "");
  const [match, setMatch] = useState(!!theme);
  const [broken, setBroken] = useState(false); // a link that isn't a picture: nothing to match
  const [status, setStatus] = useState<string | null>(null);
  // The colors read for a photo: [main, contrast?], empty = none. A new photo is read again; an uploaded one is read on the phone before upload.
  // A saved photo is read again quietly, only to offer the other choice; its saved color stays picked.
  const [read, setRead] = useState<{ url: string; colors: string[] | null }>({ url: "", colors: null }); // read when the box is ticked
  const [chosen, setChosen] = useState(theme ?? "");
  const colors = read.url === url ? read.colors ?? [] : [];
  const color = read.url === url ? (colors.includes(chosen) ? chosen : colors[0] ?? "") : url === value && theme ? chosen : "";
  useEffect(() => {
    if (!match || !url || read.url === url) return;
    let live = true;
    const quiet = url === value && !!theme;
    if (!quiet) setStatus("Reading the photo’s color…");
    // Straight from the link when its site allows it; otherwise through chirk's server (Pinterest, Google).
    photoColors(url)
      .catch(async () => { const copy = await photoForColor(url); if (!copy) throw new Error(); return photoColors(copy); })
      .then((c) => {
        if (!live) return;
        setRead({ url, colors: quiet && !c.includes(theme) ? [theme] : c }); // a saved color the photo no longer gives stays as it was
        if (!quiet) { setChosen(c[0] ?? ""); setStatus(c.length ? "Color matched ✓ Tap Save to keep it." : "This photo has no clear color, so the invite stays plain."); }
      }, () => {
        if (!live || quiet) return;
        setMatch(false); // untick now, with the reason beside it, so Save doesn't look like it lost the setting
        setStatus("Couldn’t read this photo’s color, so the box is unticked. Save the image and upload it instead to match it.");
      });
    return () => { live = false; };
  }, [match, url, read.url, value, theme]);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      setStatus("Shrinking…");
      const jpeg = await shrinkPhoto(file);
      const local = URL.createObjectURL(jpeg);
      const c = await photoColors(local).catch(() => []);
      URL.revokeObjectURL(local);
      setStatus("Uploading…");
      const f = new FormData();
      f.append("photo", new File([jpeg], "photo.jpg", { type: "image/jpeg" }));
      const res = await uploadPhoto(f);
      if ("error" in res) setStatus(res.error);
      else { setRead({ url: res.url, colors: c }); setChosen(c[0] ?? ""); setUrl(res.url); setStatus("Uploaded ✓ Tap Save to keep it."); }
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
          {match && color && colors.length < 2 && <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border border-line" style={{ background: color }} />}
        </label>
      )}
      {url && !broken && match && colors.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {colors.map((c, i) => (
            <button key={c} type="button" className="choice" aria-pressed={color === c} onClick={() => { setChosen(c); setStatus("Tap Save to keep it."); }}>
              <span aria-hidden className="mr-2 inline-block h-4 w-4 rounded-full border border-line align-[-2px]" style={{ background: c }} />
              {i ? "Contrast color" : "Main color"}
            </button>
          ))}
        </div>
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

/** The photo's main color (from a 24×24 copy) and, if it has one, a contrasting one (48×48, so small bright areas count).
 *  A link works only if its site allows it (many, like Pinterest, don't). */
async function photoColors(src: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const px = (n: number) => {
    const c = document.createElement("canvas");
    c.width = c.height = n;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, n, n);
    return ctx.getImageData(0, 0, n, n).data;
  };
  const main = mainColor(px(24));
  const contrast = main && accentColor(px(48), main);
  return [main, contrast].filter((c): c is string => !!c);
}
