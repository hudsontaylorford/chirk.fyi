"use client";

import { useActionState } from "react";

/** "+ Add a co-host": their email; chirk adds them to this event and emails them. */
export function AddCohost({ action }: { action: (prev: string | null, f: FormData) => Promise<string> }) {
  const [result, add, adding] = useActionState(action, null);
  return (
    <details className="mt-1">
      <summary className="link tap cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">+ Add a co-host</summary>
      <form action={add} className="mt-1 flex flex-wrap gap-2">
        <input name="email" type="email" inputMode="email" autoComplete="off" spellCheck={false} autoCapitalize="off" className="field min-w-0 flex-[1_1_10rem]" placeholder="Their email" aria-label="Co-host's email" required />
        <button className="button-quiet shrink-0 min-h-[3.2rem]" disabled={adding}>{adding ? "Adding…" : "Add"}</button>
      </form>
      {result && <p role="status" className="mt-1 text-[14px]">{result}</p>}
    </details>
  );
}
