"use client";

import { useActionState } from "react";

/** "+ Add a co-host": their email; chirk adds them to this event and emails them. */
export function AddCohost({ action }: { action: (prev: string | null, f: FormData) => Promise<string> }) {
  const [result, add, adding] = useActionState(action, null);
  return (
    <details className="mt-1">
      <summary className="inline cursor-pointer list-none font-semibold text-ink underline underline-offset-2 [&::-webkit-details-marker]:hidden">+ Add a co-host</summary>
      <form action={add} className="mt-2 flex gap-2">
        <input name="email" type="email" inputMode="email" className="field" placeholder="Their email" aria-label="Co-host's email" required />
        <button className="btn shrink-0 px-4" disabled={adding}>{adding ? "Adding…" : "Add"}</button>
      </form>
      {result && <p role="status" className="mt-1 text-[14px]">{result}</p>}
    </details>
  );
}
