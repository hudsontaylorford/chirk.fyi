"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/** A form's submit button that says "Saving…" while working and "Saved ✓" when done. */
export function SaveButton({ children, className = "btn" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
    was.current = pending;
  }, [pending]);
  return (
    <button className={className} disabled={pending}>
      {pending ? "Saving…" : saved ? "Saved ✓" : children}
    </button>
  );
}
