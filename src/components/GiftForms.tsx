"use client";

import { useActionState } from "react";

/** A button that runs a gift-exchange action and says how it went (asking first when `confirm` is set). */
export function GiftButton({ action, label, confirm, quiet }: {
  action: () => Promise<string>; label: string; confirm?: string; quiet?: boolean;
}) {
  const [result, run, running] = useActionState(async () => action(), null);
  return (
    <form action={run} className="inline">
      <button
        className={quiet ? "btn btn-quiet border border-line bg-white px-4 text-[15px]" : "btn px-4 text-[15px]"} disabled={running}
        onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}
      >
        {running ? "Working…" : label}
      </button>
      {result && <span role="status" className="ml-2 text-[14px] text-soft">{result}</span>}
    </form>
  );
}

/** A guest's gift ideas, for whoever draws them. */
export function WishForm({ action, wish }: { action: (prev: string | null, f: FormData) => Promise<string>; wish: string | null }) {
  const [result, save, saving] = useActionState(action, null);
  return (
    <form action={save} className="mt-3">
      <label className="text-[15px] text-soft" htmlFor="wish">Your gift ideas, for whoever draws you</label>
      <textarea id="wish" name="wish" rows={2} defaultValue={wish ?? ""} className="field mt-1" placeholder="Sizes, favorites, things you'd love" />
      <div className="mt-2 flex items-center gap-3">
        <button className="btn btn-quiet border border-line bg-white px-4" disabled={saving}>{saving ? "Saving…" : "Save ideas"}</button>
        {result && <span role="status" className="text-[14px] text-soft">{result}</span>}
      </div>
    </form>
  );
}
