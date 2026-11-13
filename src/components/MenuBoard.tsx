import Link from "next/link";
import { dishLabel, singular, summarize } from "@/lib/menu";
import type { Board } from "@/lib/types";

/** The public menu: what's still needed, then everything claimed so far. */
export function MenuBoard({ board, claimable = true }: { board: Board; claimable?: boolean }) {
  const s = summarize(board);
  const slug = board.event.slug;
  const core = s.categories.filter((c) => c.category.kind === "core");
  const open = s.categories.filter((c) => c.category.kind === "open");

  return (
    <section className="paper px-5 py-6 sm:px-8" id="menu">
      <h2 className="smallcaps text-center text-xl text-maroon">The Menu So Far</h2>
      <p className="mt-1 text-center text-[15px] italic text-muted">
        Check what’s covered before you choose, so we don’t end up with two of everything.
      </p>

      {s.openSlots.length > 0 && (
        <div className="mt-5 rounded-md border border-gold/60 bg-[#fff7e3] p-4">
          <h3 className="smallcaps text-[15px] text-maroon">Still needed</h3>
          <p className="text-[15px] italic text-muted">The main dishes nobody has claimed yet.</p>
          <ul className="mt-2 divide-y divide-line">
            {s.openSlots.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-[17px] font-medium">{slot.name}</span>
                {claimable && (
                  <Link
                    href={`/${slug}/rsvp?slot=${slot.id}`}
                    className="shrink-0 rounded-full bg-maroon px-3 py-1 text-[14px] text-cream"
                  >
                    I’ll bring it
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.openSlots.length === 0 && board.slots.length > 0 && (
        <p className="mt-5 rounded-md bg-[#eef3e6] p-3 text-center text-[16px] text-ok">
          Every main dish is spoken for. Apps, desserts and drinks still welcome.
        </p>
      )}

      {core.map(({ category }) => (
        <div key={category.id} className="mt-6">
          <CategoryHeading name={category.name} />
          <ul className="mt-2 space-y-1">
            {board.slots
              .filter((sl) => sl.category_id === category.id)
              .map((slot) => {
                const d = s.claimBySlot.get(slot.id);
                return (
                  <li key={slot.id} className="flex items-baseline justify-between gap-3 text-[17px]">
                    <span className={d ? "" : "text-muted/70"}>
                      {d?.dish_name && !d.dish_name.toLowerCase().includes(slot.name.split(/\s/)[0].toLowerCase()) ? (
                        <>
                          {d.dish_name} <span className="text-[14px] text-muted">({slot.name})</span>
                        </>
                      ) : (
                        d?.dish_name || slot.name
                      )}
                    </span>
                    <Dots />
                    <span className={`shrink-0 italic ${d ? "" : "text-gold"}`}>{d ? d.guest.name : "open"}</span>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}

      {open.map((c) => (
        <div key={c.category.id} className="mt-6">
          <CategoryHeading
            name={c.category.name}
            right={c.category.soft_cap ? `${c.count} of ~${c.category.soft_cap}` : `${c.count}`}
            full={c.atCap}
          />
          {c.atCap && c.category.nudge && (
            <p className="mt-1 text-[15px] italic text-alert">{c.category.nudge}</p>
          )}
          {c.dishes.length === 0 ? (
            <p className="mt-1 text-[16px] italic text-muted/70">Nothing yet. Be the first!</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {c.dishes.map((d) => (
                <li key={d.id} className="flex items-baseline justify-between gap-3 text-[17px]">
                  <span className={d.dish_name ? "" : "italic text-muted"}>
                    {d.dish_name ?? `${singular(c.category.name)} (TBD)`}
                  </span>
                  <Dots />
                  <span className="shrink-0 italic">{d.guest.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

function CategoryHeading({ name, right, full }: { name: string; right?: string; full?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-1">
      <h3 className="smallcaps text-[15px] text-maroon">{name}</h3>
      {right && <span className={`text-[14px] ${full ? "font-semibold text-alert" : "text-muted"}`}>{right}</span>}
    </div>
  );
}

function Dots() {
  return <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-muted/40" />;
}

export { dishLabel };
