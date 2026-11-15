import { addCost, addPoker, markPaid, removeCost, removePoker, saveVenmo } from "@/app/costs";
import { Confirm } from "@/components/Confirm";
import { CostForm, PokerForm, VenmoForm } from "@/components/CostForms";
import { balances, money, poker, settle, venmoUrl } from "@/lib/costs";
import { getCosts, joinNames } from "@/lib/data";
import type { EventData } from "@/lib/types";

/**
 * Shared costs on an event: what's been spent, and who pays whom to even up.
 * Everyone who can see it sees the costs; guests see only their own payments, hosts see all of them.
 * `token` = the guest viewing (their reply), `host` = a host viewing.
 */
export async function Costs({ data, token, host, inside = false }: { data: EventData; token: string | null; host: boolean; inside?: boolean }) {
  const { event, households } = data;
  const all = await getCosts(event.id);
  // Costs entered while "Split costs" was on stay saved but drop out of everything once it's off.
  const { payments, poker: entries } = all;
  const costs = event.costs_on ? all.costs : [];
  // A poker game joins the settle-up once everyone has cashed out and the chips add up.
  const game = poker(entries);
  const me = households.find((h) => h.token === token && h.going) ?? null;
  const going = households.filter((h) => h.going);
  const name = (id: string) => (id === me?.id ? "you" : joinNames(households.find((h) => h.id === id)?.names ?? ["someone"]));
  const total = costs.reduce((n, c) => n + c.amount, 0);
  const owed = settle(balances(costs.map((c) => ({ amount: c.amount, paidBy: c.paid_by, split: c.split })), payments, game.ready ? game.nets : undefined));
  const mine = host ? owed : owed.filter((p) => me && (p.from === me.id || p.to === me.id));
  const canAdd = host || !!me;
  const anything = costs.length > 0 || game.ready;
  const signed = (cents: number) => (cents > 0 ? `+${money(cents)}` : cents < 0 ? `−${money(-cents)}` : "$0");
  const venmoOf = (id: string) => households.find((h) => h.id === id)?.venmo;
  const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const people = (split: { shares: number }[]) => split.reduce((n, x) => n + x.shares, 0);

  return (
    <section className={inside ? "mt-8" : "mx-auto mt-10 max-w-lg px-5"}>
      <h2 className="text-[20px] font-bold">
        {event.costs_on ? "Costs" : "Poker night"} {total > 0 && <span className="font-normal text-soft">· {money(total)} so far</span>}
      </h2>

      {!event.costs_on ? null : costs.length === 0 ? (
        <p className="mt-2 text-soft">Nothing added yet. Whoever pays for something can add it here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {costs.map((c) => (
            <li key={c.id} className="py-3 text-[16px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{c.what}</span>
                <span className="tabular-nums">{money(c.amount)}</span>
              </div>
              <p className="text-[15px] text-soft">
                {capital(name(c.paid_by))} paid · {c.split.length === going.length ? "split between everyone going" : `split between ${people(c.split)} ${people(c.split) === 1 ? "person" : "people"}`}
                {(host || c.paid_by === me?.id) && (
                  <> · <Confirm label="Remove" action={removeCost.bind(null, event.slug, token, c.id)} /></>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {event.poker_on && (
        <div className={event.costs_on ? "mt-6" : "mt-2"}>
          {event.costs_on && <h3 className="text-[17px] font-semibold">Poker</h3>}
          {game.players.size === 0 ? (
            <p className="mt-1 text-soft">No buy-ins yet.</p>
          ) : (
            <>
              <table className="mt-2 w-full text-[16px] tabular-nums">
                <thead><tr className="text-left text-[14px] text-soft"><th className="font-normal">Player</th><th className="text-right font-normal">In</th><th className="text-right font-normal">Out</th><th className="text-right font-normal">Net</th></tr></thead>
                <tbody>
                  {[...game.players].map(([who, p]) => (
                    <tr key={who} className="border-t border-line">
                      <td className="py-2 pr-2">{capital(name(who))}</td>
                      <td className="text-right">{money(p.in)}</td>
                      <td className="text-right">{p.out === null ? "—" : money(p.out)}</td>
                      <td className={`text-right font-semibold ${p.out === null ? "text-soft" : ""}`}>{p.out === null ? "—" : signed(p.out - p.in)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[15px] text-soft">
                In {money(game.totalIn)} · Out {money(game.totalOut)}
                {game.ready ? " ✓ Added to settle up." : !game.allOut ? ` · waiting on ${[...game.players.values()].filter((p) => p.out === null).length} to cash out` : game.totalOut > game.totalIn ? ` · out is ${money(game.totalOut - game.totalIn)} over` : ` · out is ${money(game.totalIn - game.totalOut)} short`}
              </p>
              <details className="mt-1 text-[14px] text-soft">
                <summary className="cursor-pointer">Every buy-in and cash-out</summary>
                <ul className="mt-1 space-y-1">
                  {entries.map((e) => (
                    <li key={e.id}>
                      {capital(name(e.who))} · {e.kind === "buyin" ? "bought in" : "cashed out"} {money(e.amount)}
                      {(host || e.who === me?.id) && <> · <Confirm label="Remove" action={removePoker.bind(null, event.slug, token, e.id)} /></>}
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
          {canAdd && <PokerForm action={addPoker.bind(null, event.slug, token)} host={host} me={me?.id ?? null} players={going.map((h) => ({ id: h.id, name: joinNames(h.names) }))} />}
        </div>
      )}

      {anything && (host || me) && (
        <div className="mt-6">
          <h3 className="text-[17px] font-semibold">{host ? "Settle up" : "Your share"}</h3>
          {mine.length === 0 ? (
            <p className="mt-1 text-soft">{host ? "Everyone's even ✓" : "You're all square ✓"}</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {mine.map((p) => {
                const iOwe = p.from === me?.id;
                const handle = venmoOf(p.to);
                return (
                  <li key={`${p.from}-${p.to}`} className="rounded-2xl bg-wash p-3 text-[16px]">
                    <p>
                      {iOwe ? <>You owe <strong>{name(p.to)}</strong></> : <><strong>{capital(name(p.from))}</strong> {p.from === me?.id ? "owe" : "owes"} <strong>{name(p.to)}</strong></>}{" "}
                      <strong className="tabular-nums">{money(p.amount)}</strong>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[15px]">
                      {iOwe && handle && (
                        <a href={venmoUrl(handle, p.amount, `${event.title} · costs`)} className="btn px-4 text-[15px]">Pay with Venmo</a>
                      )}
                      {iOwe && !handle && <span className="text-soft">Ask them for their Venmo, or add yours below so they can pay you.</span>}
                      {(host || p.to === me?.id) && (
                        <form action={markPaid.bind(null, event.slug, token, p.from, p.to, p.amount)}>
                          <button className="font-semibold underline underline-offset-2">Mark paid ✓</button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {canAdd && event.costs_on && (
        <CostForm
          action={addCost.bind(null, event.slug, token)}
          host={host}
          me={me?.id ?? null}
          going={going.map((h) => ({ id: h.id, name: joinNames(h.names) }))}
        />
      )}
      {me && <VenmoForm action={saveVenmo.bind(null, event.slug, token!)} venmo={me.venmo} />}
    </section>
  );
}
