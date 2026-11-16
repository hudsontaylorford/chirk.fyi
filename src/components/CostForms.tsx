"use client";

import { useActionState } from "react";

type Send = (prev: string | null, f: FormData) => Promise<string>;

/** "+ Add a cost": what it was, the amount, who paid (hosts pick; guests are the payer), and who it's split between. */
export function CostForm({ action, host, me, going }: { action: Send; host: boolean; me: string | null; going: { id: string; name: string; people: number }[] }) {
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
          <legend className="text-[15px] text-soft">Split between (per person: a couple pays for two)</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {going.map((g) => (
              <label key={g.id} className="pill-check">
                <input type="checkbox" name="split" value={g.id} defaultChecked className="h-4 w-4" />
                {g.id === me ? "You" : g.name}
                {g.people > 1 && <span className="opacity-60">×{g.people}</span>}
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

/** Poker: a buy-in or a cash-out for a player (hosts pick anyone; players enter their own). */
export function PokerForm({ action, host, me, usual, players }: { action: Send; host: boolean; me: string | null; usual: string; players: { id: string; name: string }[] }) {
  const [result, add, adding] = useActionState(action, null);
  return (
    <form action={add} className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Buy-in or cash-out">
        <label className="pill-check">
          <input type="radio" name="kind" value="buyin" defaultChecked className="h-4 w-4" /> Buy-in
        </label>
        <label className="pill-check">
          <input type="radio" name="kind" value="cashout" className="h-4 w-4" /> Cash-out
        </label>
      </div>
      <div className="flex gap-2">
        {host && (
          <select name="who" defaultValue={me ?? players[0]?.id} className="field" aria-label="Player">
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <input name="amount" className="field w-28 shrink-0" inputMode="decimal" placeholder="$20" defaultValue={usual} aria-label="Poker amount" required />
        <button className="btn shrink-0 px-4" disabled={adding}>{adding ? "…" : "Add"}</button>
      </div>
      {result && <p role="status" className="text-[14px] text-soft">{result}</p>}
    </form>
  );
}

/** "Everyone buys in": one buy-in of this amount for everyone at the table who hasn't bought in yet. */
export function BuyInAll({ action, usual }: { action: Send; usual: string }) {
  const [result, run, running] = useActionState(action, null);
  return (
    <form action={run} className="mt-2 rounded-2xl bg-wash p-3">
      <p className="text-[15px] font-semibold">Everyone buys in</p>
      <div className="mt-2 flex gap-2">
        <input name="amount" className="field" inputMode="decimal" placeholder="$20" defaultValue={usual} aria-label="Buy-in for everyone" required />
        <button className="btn shrink-0 px-4" disabled={running}>{running ? "…" : "Buy in all"}</button>
      </div>
      <p className="mt-1 text-[14px] text-soft">Adds one buy-in for everyone at the table who hasn&apos;t bought in yet. Rebuys go below.</p>
      {result && <p role="status" className="mt-1 text-[14px]">{result}</p>}
    </form>
  );
}
