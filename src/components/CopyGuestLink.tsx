"use client";

import { useState } from "react";

export function CopyGuestLink({ path }: { path: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-maroon underline"
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.origin + path).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copied ✓" : "Copy their link"}
    </button>
  );
}
