import { addCost, markPaid, removeCost, saveVenmo } from "@/app/costs";
import { Confirm } from "@/components/Confirm";
import { CostForm, VenmoForm } from "@/components/CostForms";
import { balances, money, settle, venmoUrl } from "@/lib/costs";
import { getCosts, joinNames } from "@/lib/data";
import type { EventData } from "@/lib/types";

/**
 * Shared costs on an event: what's been spent, and who pays whom to even up.
 * Everyone who can see it sees the costs; guests see only their own payments, hosts see all of them.
 * `token` = the guest viewing (their reply), `host` = a host viewing.
 */
export async function Costs({ data, token, host, inside = false }: { data: EventData; token: string | null; host: boolean; inside?: boolean }) {
  const { event, households } = data;
  const { costs, payments } = await getCosts(event.id);
  const me = households.find((h) => h.token === token && h.going) ?? null;
  const going = households.filter((h) => h.going);
  const name = (id: string) => (id === me?.id ? "you" : joinNames(households.find((h) => h.id === id)?.names ?? ["someone"]));
  const total = costs.reduce((n, c) => n + c.amount, 0);
  const owed = settle(balances(costs.map((c) => ({ amount: c.amount, paidBy: c.paid_by, split: c.split })), payments));
  const mine = host ? owed : owed.filter((p) => me && (p.from === me.id || p.to === me.id));
  const canAdd = host || !!me;
  const venmoOf = (id: string) => households.find((h) => h.id === id)?.venmo;
  const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const people = (split: { shares: number }[]) => split.reduce((n, x) => n + x.shares, 0);

  return (
    <section className={inside ? "mt-8" : "mx-auto mt-10 max-w-lg px-5"}>
      <h2 className="text-[20px] font-bold">
        Costs {total > 0 && <span className="font-normal text-soft">· {money(total)} so far</span>}
      </h2>

      {costs.length === 0 ? (
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

      {costs.length > 0 && (host || me) && (
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

      {canAdd && (
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
