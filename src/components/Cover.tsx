"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

/**
 * The cover photo. If the link doesn't load, guests simply see no photo (never a broken box),
 * and on the host's form a warning explains why.
 * Full column width at its natural shape, on every screen: never cropped (the photo is the host's, edges and all).
 */
export function Cover({ src, host = false, title, onBroken }: { src: string; host?: boolean; title?: string; onBroken?: (broken: boolean) => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => onBroken?.(broken), [broken, onBroken]);
  useEffect(() => {
    setBroken(false);
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setBroken(true); // failed before the page finished loading
  }, [src]);

  if (broken) {
    return host ? (
      <p className="rounded-lg bg-red-50 p-3 text-[15px] text-red-800">
        This link isn&apos;t a picture, so guests won&apos;t see a photo. Share links (like pin.it) open a page, not the image. Save the image and upload it, or paste the image&apos;s own address (press and hold the picture, then Copy Image Address).
      </p>
    ) : null;
  }
  return <img ref={ref} src={src} alt={host ? "Current cover" : title ? `Invitation photo for ${title}` : "Invitation photo"} fetchPriority={host ? undefined : "high"} onError={() => setBroken(true)} className={host ? "h-auto w-32 rounded-lg" : "h-auto w-full"} />;
}

/** Resolves to whether an image link loads (used before copying an invite for email). */
export function imageLoads(src: string) {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = src;
    setTimeout(() => resolve(false), 5000);
  });
}
