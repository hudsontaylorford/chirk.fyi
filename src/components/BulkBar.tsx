"use client";

import { useActionState } from "react";

type Act = { value: string; label: string; confirm?: string };

/**
 * "Select" for a list: opening it shows a checkbox on each row (rows mark theirs with class "pick" and
 * `form={formId}`), and the buttons act on the ticked rows. Risky actions ask first.
 */
export function BulkBar({ formId, actions, action }: {
  formId: string; actions: Act[]; action: (prev: string | null, f: FormData) => Promise<string>;
}) {
  const [result, run, running] = useActionState(action, null);
  return (
    <details className="bulk mt-3">
      <summary className="inline cursor-pointer list-none text-[15px] font-semibold underline underline-offset-2 [&::-webkit-details-marker]:hidden">
        Select
      </summary>
      <form id={formId} action={run} className="mt-2 flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <button
            key={a.value} name="do" value={a.value} disabled={running}
            className={`pill px-3 py-1.5 text-[15px] ${a.confirm ? "text-red-700" : ""}`}
            onClick={(e) => { if (a.confirm && !window.confirm(a.confirm)) e.preventDefault(); }}
          >
            {a.label}
          </button>
        ))}
        {running && <span className="text-[14px] text-soft">Working…</span>}
      </form>
      {result && <p role="status" className="mt-1 text-[14px] text-soft">{result}</p>}
    </details>
  );
}

/** The checkbox each row shows while "Select" is open. */
export function Pick({ formId, value, label }: { formId: string; value: string; label: string }) {
  return (
    <label className="pick shrink-0 items-center pr-3">
      <input type="checkbox" name="pick" value={value} form={formId} className="h-5 w-5" aria-label={`Select ${label}`} />
    </label>
  );
}
