"use client";

import { useActionState } from "react";

type Send = (prev: string | null, f: FormData) => Promise<string>;

/** "+ Add a cost": what it was, the amount, who paid (hosts pick; guests are the payer), and who it's split between. */
export function CostForm({ action, host, me, going }: { action: Send; host: boolean; me: string | null; going: { id: string; name: string }[] }) {
  const [result, add, adding] = useActionState(action, null);
  return (
    <details className="mt-6 rounded-2xl border border-line px-4 py-3">
      <summary className="cursor-pointer text-[16px] font-semibold">+ Add a cost</summary>
      <form action={add} className="mt-3 space-y-3">
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <input name="what" className="field" placeholder="What for (tickets, groceries…)" aria-label="What for" required />
          <input name="amount" className="field" inputMode="decimal" placeholder="$0.00" aria-label="Amount" required />
        </div>
        {host && (
          <label className="block">
            <span className="text-[15px] text-soft">Paid by</span>
            <select name="paid_by" defaultValue={me ?? going[0]?.id} className="field mt-1">
              {going.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
        )}
        <fieldset>
          <legend className="text-[15px] text-soft">Split between (each person counts once)</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {going.map((g) => (
              <label key={g.id} className="pill flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[15px] has-[:checked]:border-ink">
                <input type="checkbox" name="split" value={g.id} defaultChecked className="h-4 w-4" />
                {g.id === me ? "You" : g.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn w-full" disabled={adding}>{adding ? "Adding…" : "Add cost"}</button>
        {result && <p role="status" className="text-[15px] text-soft">{result}</p>}
      </form>
    </details>
  );
}

/** A guest's Venmo username, so people who owe them can pay with one tap. */
export function VenmoForm({ action, venmo }: { action: Send; venmo: string | null }) {
  const [result, save, saving] = useActionState(action, null);
  return (
    <form action={save} className="mt-4">
      <label className="text-[15px] text-soft" htmlFor="venmo">Your Venmo, so people can pay you back</label>
      <div className="mt-1 flex gap-2">
        <input id="venmo" name="venmo" className="field" defaultValue={venmo ?? ""} placeholder="@username" autoCapitalize="off" autoCorrect="off" />
        <button className="btn btn-quiet shrink-0 border border-line bg-white px-4" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </div>
      {result && <p role="status" className="mt-1 text-[14px] text-soft">{result}</p>}
    </form>
  );
}
