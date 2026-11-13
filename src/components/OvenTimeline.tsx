import { clock } from "@/lib/format";
import { ovenTimeline, range } from "@/lib/oven";
import type { Board } from "@/lib/types";

/** Host-only: every oven dish laid out around dinner, with conflicts flagged. */
export function OvenTimeline({
  board, setReady,
}: {
  board: Board;
  setReady: (f: FormData) => Promise<void>;
}) {
  const t = ovenTimeline(board);
  const min = Math.floor(t.min / 30) * 30;
  const max = Math.ceil(t.max / 30) * 30;
  const pct = (m: number) => ((m - min) / (max - min)) * 100;
  const hours: number[] = [];
  for (let h = Math.ceil(min / 60) * 60; h <= max; h += 60) hours.push(h);
  const conflicted = new Set(t.conflicts.flatMap((c) => c.dishIds));

  return (
    <div>
      <p className="text-[15px] text-muted">
        {t.ovenCount} oven{t.ovenCount > 1 ? "s" : ""}, about {t.capacity} dishes at once. Dinner {clock(t.dinner)}, dessert ~{clock(t.dessert)}.
      </p>

      {t.items.length === 0 ? (
        <p className="mt-3 italic text-muted">No oven requests yet.</p>
      ) : (
        <>
          {t.conflicts.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {t.conflicts.map((c, i) => (
                <li key={i} className="rounded-md bg-alert/10 p-3 text-[15px] text-alert">
                  <strong>{range(c.start, c.end)}</strong>: {c.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-md bg-[#eef3e6] p-3 text-[15px] text-ok">No oven conflicts. Nice.</p>
          )}

          <div className="relative mt-8">
            <div className="relative h-5 text-[12px] text-muted">
              {hours.map((h) => (
                <span key={h} className="absolute -translate-x-1/2" style={{ left: `${pct(h)}%` }}>
                  {clock(h).replace(":00", "").replace(" ", "")}
                </span>
              ))}
              <span className="absolute -translate-x-1/2 font-semibold text-maroon" style={{ left: `${pct(t.dinner)}%`, top: "-1.1rem" }}>
                dinner
              </span>
            </div>
            <div className="relative space-y-3 border-t border-line pt-3">
              {t.items.map((it) => (
                <div key={it.dish.id}>
                  <div className="flex items-baseline justify-between gap-2 text-[15px]">
                    <span className="font-medium">
                      {it.label} <span className="font-normal text-muted">· {it.guestName}</span>
                    </span>
                    <span className="shrink-0 text-muted tabular-nums">
                      {it.missing ? <span className="text-alert">details missing</span> : `${it.temp}° · ${it.dish.oven_minutes}m`}
                    </span>
                  </div>
                  <div className="relative mt-1 h-3 rounded bg-line/50">
                    <div className="absolute -top-1 -bottom-1 w-0.5 bg-maroon" style={{ left: `${pct(t.dinner)}%` }} title="Dinner" />
                    <div
                      className={`absolute h-3 rounded ${conflicted.has(it.dish.id) ? "bg-alert" : "bg-gold"}`}
                      style={{ left: `${pct(it.start)}%`, width: `${Math.max(1.5, pct(it.end) - pct(it.start))}%` }}
                    />
                  </div>
                  <form action={setReady} className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-muted">
                    <input type="hidden" name="dish_id" value={it.dish.id} />
                    <span>{range(it.start, it.end)}{it.overridden ? " (adjusted)" : ""} · out by</span>
                    <input
                      type="time" name="ready_at" defaultValue={it.dish.oven_ready_at?.slice(0, 5) ?? ""}
                      className="rounded border border-line bg-white px-1 py-0.5 text-[15px]"
                    />
                    <button className="underline">Set</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[14px] italic text-muted">
            By default, “ready for dinner” dishes come out at dinner time and dessert dishes come out at ~{clock(t.dessert)}.
            Set an “out by” time to move one (e.g. pull the turkey early to rest). Clear it to go back to the default.
          </p>
        </>
      )}
    </div>
  );
}
