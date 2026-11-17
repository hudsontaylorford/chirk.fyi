"use client";

import { useActionState } from "react";
import { importPlan } from "@/app/import";

/** One quiet line on New event: paste a text or add a screenshot, and the form below fills itself in. */
export function ImportBox() {
  const [problem, read, reading] = useActionState(importPlan, null);
  return (
    <details className="mt-1 text-[15px]" open={!!problem}>
      <summary className="cursor-pointer list-none text-soft underline underline-offset-2 [&::-webkit-details-marker]:hidden">Make it from a text or screenshot</summary>
      <form action={read} className="mt-2 space-y-2">
        <textarea name="text" rows={5} className="field" aria-label="Pasted text" placeholder="Paste a group text, an email, an invite…" />
        <label className="block">
          <span className="text-[14px] text-soft">Or a screenshot, photo or PDF (optional)</span>
          <input name="file" type="file" accept="image/*,application/pdf" className="mt-1 block w-full text-[15px]" />
        </label>
        <button className="btn w-full" disabled={reading}>{reading ? "Reading…" : "Fill in the form"}</button>
        {problem && <p role="alert" className="text-[15px] text-red-700">{problem}</p>}
        <p className="text-[14px] text-soft">chirk reads it and fills in what it finds. Check everything before you create the event; nothing is saved until then.</p>
      </form>
    </details>
  );
}
