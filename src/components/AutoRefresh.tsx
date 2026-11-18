"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps a host page current: new replies appear every 20 seconds while it's on screen, and as soon as you come back to it. */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    // Never mid-typing: a refresh then could move the cursor or the page under you.
    const tick = () => {
      if (document.visibilityState === "visible" && !document.activeElement?.matches("input, textarea, select, [contenteditable]")) router.refresh();
    };
    const id = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [router]);
  return null;
}
