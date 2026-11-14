"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

/**
 * The cover photo. If the link doesn't load, guests simply see no photo (never a broken box),
 * and on the host's form a warning explains why.
 */
export function Cover({ src, host = false }: { src: string; host?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setBroken(true); // failed before the page finished loading
  }, [src]);

  if (broken) {
    return host ? (
      <p className="rounded-lg bg-red-50 p-3 text-[15px] text-red-800">
        This image link doesn&apos;t load, so guests won&apos;t see a photo. Try a different link (one that ends in .jpg or .png works best).
      </p>
    ) : null;
  }
  return <img ref={ref} src={src} alt={host ? "Current cover" : ""} onError={() => setBroken(true)} className={host ? "h-auto w-32 rounded-lg" : "h-auto max-h-[70svh] w-full object-cover object-top"} />;
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
