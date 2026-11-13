import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyGuestLink } from "@/components/CopyGuestLink";
import { LoginForm } from "@/components/LoginForm";
import { OvenTimeline } from "@/components/OvenTimeline";
import { isHost } from "@/lib/auth";
import { getBoard } from "@/lib/data";
import { dishLabel, summarize } from "@/lib/menu";
import { ARRIVALS, KITCHEN_NEEDS } from "@/lib/types";
import * as A from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Host view", robots: { index: false } };

export default async function HostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const board = await getBoard(slug);
  if (!board) notFound();

  if (!(await isHost())) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="paper px-6 py-8">
          <h1 className="smallcaps mb-4 text-center text-xl text-maroon">Host sign-in</h1>
          <LoginForm action={A.login.bind(null, slug)} />
        </div>
      </main>
    );
  }

  const s = summarize(board);
  const { event } = board;
  const guestsById = new Map(board.guests.map((g) => [g.id, g]));
  const statusOrder = { yes: 0, maybe: 1, invited: 2, no: 3 } as const;
  const guests = [...board.guests].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name));
  const dietary = board.guests.filter((g) => g.dietary_notes && g.status !== "no");
  const tbd = board.dishes.filter((d) => !d.dish_name && !d.slot_id && guestsById.get(d.guest_id)?.status !== "no");
  const needLabel = (v: string) => KITCHEN_NEEDS.find((k) => k.value === v)?.label ?? v;
  const nonOvenNeeds = board.dishes.filter(
    (d) => d.kitchen_needs.some((k) => k === "stovetop" || k === "outlet" || k === "fridge") && guestsById.get(d.guest_id)?.status !== "no",
  );

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-3 pt-6 pb-20">
      <div className="flex items-center justify-between px-2">
        <Link href={`/${slug}`} className="text-[16px] italic">← Guest view</Link>
        <form action={A.logout.bind(null, slug)}>
          <button className="text-[15px] underline opacity-80">Sign out</button>
        </form>
      </div>
      <h1 className="smallcaps px-2 text-2xl italic">Host view</h1>

      {/* Headcount */}
      <Card title="Headcount">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat n={s.headcount.adults} label="adults" />
          <Stat n={s.headcount.kids} label="kids" />
          <Stat n={s.headcount.households} label="RSVPs" />
        </div>
        {(s.headcount.maybeAdults > 0 || s.headcount.maybeKids > 0) && (
          <p className="mt-2 text-center text-[15px] text-muted">
            Plus maybe {s.headcount.maybeAdults} adult{s.headcount.maybeAdults === 1 ? "" : "s"}
            {s.headcount.maybeKids ? ` and ${s.headcount.maybeKids} kid${s.headcount.maybeKids === 1 ? "" : "s"}` : ""}.
          </p>
        )}
        <p className="mt-2 text-center text-[15px] text-muted">
          Arriving:{" "}
          {ARRIVALS.map((a) => `${a.label.toLowerCase()} ${board.guests.filter((g) => g.status === "yes" && g.arrival_window === a.value).length}`).join(" · ")}
        </p>
      </Card>

      {/* Core slots */}
      <Card title="Main dishes">
        <ul className="divide-y divide-line">
          {board.slots.map((slot) => {
            const d = s.claimBySlot.get(slot.id);
            return (
              <li key={slot.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[17px] font-medium">{slot.name}</span>
                  {d ? (
                    <span className="text-right italic">
                      {d.guest.name}
                      {d.assigned_by_host && <span className="ml-1 text-[13px] not-italic text-muted">(assigned)</span>}
                    </span>
                  ) : (
                    <span className="font-semibold text-alert">Unclaimed</span>
                  )}
                </div>
                {d?.dish_name && d.dish_name !== slot.name && <p className="text-[15px] text-muted">{d.dish_name}</p>}
                <details className="mt-1">
                  <summary className="cursor-pointer text-[14px] text-muted underline">
                    {d ? "Reassign" : "Assign to someone"}
                  </summary>
                  <form action={A.assignSlot.bind(null, slug)} className="mt-2 space-y-2">
                    <input type="hidden" name="slot_id" value={slot.id} />
                    <select name="guest_id" className="field" defaultValue="">
                      <option value="">Pick a guest… (or type a new name below)</option>
                      {guests.filter((g) => g.status !== "no").map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <input name="new_name" className="field" placeholder="New guest name (they’ll get their own link)" />
                    <button className="btn btn-primary w-full">Assign {slot.name}</button>
                  </form>
                  {d && (
                    <div className="mt-2">
                      <ConfirmButton action={A.deleteDish.bind(null, slug, d.id)} confirm={`Release ${slot.name} from ${d.guest.name}?`}>
                        Release this slot
                      </ConfirmButton>
                    </div>
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Categories vs caps */}
      <Card title="Everything else">
        <ul className="space-y-1">
          {s.categories.filter((c) => c.category.kind === "open").map((c) => (
            <li key={c.category.id} className="flex justify-between text-[17px]">
              <span>{c.category.name}</span>
              <span className={c.overCap ? "font-semibold text-alert" : c.atCap ? "font-semibold text-gold" : ""}>
                {c.count}
                {c.category.soft_cap != null && <span className="text-muted"> / {c.category.soft_cap}</span>}
                {c.overCap ? " over" : c.atCap ? " full" : ""}
              </span>
            </li>
          ))}
        </ul>
        {tbd.length > 0 && (
          <p className="mt-3 text-[15px] text-muted">
            <strong className="text-ink">Still TBD ({tbd.length}):</strong>{" "}
            {tbd.map((d) => `${guestsById.get(d.guest_id)?.name} (${dishLabel(d, board).replace(" (TBD)", "")})`).join(", ")}
          </p>
        )}
      </Card>

      {/* Oven */}
      <Card title="Oven timeline">
        <OvenTimeline board={board} setReady={A.setOvenReady.bind(null, slug)} />
        {nonOvenNeeds.length > 0 && (
          <div className="mt-5 border-t border-line pt-3">
            <p className="smallcaps text-[14px] text-maroon">Other kitchen needs</p>
            <ul className="mt-1 space-y-1 text-[15px]">
              {nonOvenNeeds.map((d) => (
                <li key={d.id}>
                  <span className="font-medium">{dishLabel(d, board)}</span> · {guestsById.get(d.guest_id)?.name}:{" "}
                  {d.kitchen_needs.filter((k) => k !== "oven" && k !== "ready").map(needLabel).join(", ")}
                  {d.timing === "after" ? " (after dinner)" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Dietary */}
      <Card title="Dietary notes">
        {dietary.length === 0 ? (
          <p className="italic text-muted">None so far.</p>
        ) : (
          <ul className="space-y-1 text-[17px]">
            {dietary.map((g) => (
              <li key={g.id}>
                <span className="font-medium">{g.name}:</span> {g.dietary_notes}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Guests */}
      <Card title={`Guests (${board.guests.length})`}>
        <p className="mb-2 text-[14px] italic text-muted">
          Tap a name to open their RSVP and edit it for them. “Copy link” gets you their personal link to send them.
        </p>
        <ul className="divide-y divide-line">
          {guests.map((g) => {
            const dishes = board.dishes.filter((d) => d.guest_id === g.id);
            return (
              <li key={g.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <Link href={`/${slug}/me/${g.edit_token}`} className="text-[17px] font-semibold underline decoration-line underline-offset-4">
                    {g.name}
                  </Link>
                  <StatusPill status={g.status} />
                </div>
                <p className="text-[14px] text-muted">
                  {g.adults} adult{g.adults === 1 ? "" : "s"}
                  {g.kids ? `, ${g.kids} kid${g.kids === 1 ? "" : "s"}` : ""}
                  {g.arrival_window ? ` · ${ARRIVALS.find((a) => a.value === g.arrival_window)?.label.toLowerCase()}` : ""}
                </p>
                {dishes.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[15px]">
                    {dishes.map((d) => (
                      <li key={d.id} className="flex items-baseline justify-between gap-2">
                        <span>
                          {dishLabel(d, board)}
                          {d.kitchen_needs.includes("oven") && d.oven_temp_f && (
                            <span className="text-muted"> · {d.oven_temp_f}° {d.oven_minutes}m</span>
                          )}
                        </span>
                        <ConfirmButton action={A.deleteDish.bind(null, slug, d.id)} confirm={`Remove “${dishLabel(d, board)}” from ${g.name}?`} className="text-[13px] text-muted underline">
                          remove
                        </ConfirmButton>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex gap-4 text-[14px]">
                  <CopyGuestLink path={`/${slug}/me/${g.edit_token}`} />
                  <ConfirmButton action={A.deleteGuest.bind(null, slug, g.id)} confirm={`Delete ${g.name} and everything they’re bringing?`}>
                    Delete guest
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Settings */}
      <Card title="Settings">
        <details>
          <summary className="cursor-pointer text-[17px] font-medium">Event details</summary>
          <form action={A.updateEvent.bind(null, slug)} className="mt-3 space-y-3">
            <Input label="Title" name="title" defaultValue={event.title} />
            <Input label="Opening line" name="tagline" defaultValue={event.tagline} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" name="event_date" type="date" defaultValue={event.event_date} />
              <Input label="Dinner time" name="dinner_time" type="time" defaultValue={event.dinner_time.slice(0, 5)} />
              <Input label="RSVP deadline" name="rsvp_deadline" type="date" defaultValue={event.rsvp_deadline} />
              <Input label="Name-your-dish deadline" name="dish_name_deadline" type="date" defaultValue={event.dish_name_deadline} />
            </div>
            <Input label="Meal length (minutes)" name="meal_minutes" type="number" defaultValue={String(event.meal_minutes)} />
            <Input label="Location name" name="location_name" defaultValue={event.location_name} />
            <Area label="Address" name="address" rows={2} defaultValue={event.address} />
            <Area label="Invitation" name="invite_copy" rows={6} defaultValue={event.invite_copy} />
            <Area label="House notes (one per line)" name="house_rules" rows={6} defaultValue={event.house_rules} />
            <Area label="Closing line" name="closing_note" rows={2} defaultValue={event.closing_note} />
            <button className="btn btn-primary w-full">Save event details</button>
          </form>
        </details>

        <details className="mt-4 border-t border-line pt-4">
          <summary className="cursor-pointer text-[17px] font-medium">Main dish slots</summary>
          <ul className="mt-3 space-y-2">
            {board.slots.map((slot) => (
              <li key={slot.id} className="flex items-center gap-2">
                <form action={A.saveSlot.bind(null, slug)} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={slot.id} />
                  <input name="name" defaultValue={slot.name} className="field py-1.5" />
                  <button className="text-[14px] underline">Save</button>
                </form>
                <ConfirmButton action={A.deleteSlot.bind(null, slug, slot.id)} confirm={`Delete the “${slot.name}” slot?`}>
                  ✕
                </ConfirmButton>
              </li>
            ))}
          </ul>
          <form action={A.saveSlot.bind(null, slug)} className="mt-3 flex gap-2">
            <input name="name" placeholder="New slot, e.g. Gravy" className="field py-1.5" />
            <button className="btn btn-primary py-1.5">Add</button>
          </form>
        </details>

        <details className="mt-4 border-t border-line pt-4">
          <summary className="cursor-pointer text-[17px] font-medium">Categories &amp; soft caps</summary>
          <div className="mt-3 space-y-4">
            {board.categories.filter((c) => c.kind === "open").map((c) => (
              <form key={c.id} action={A.updateCategory.bind(null, slug)} className="space-y-2 rounded-md border border-line p-3">
                <input type="hidden" name="id" value={c.id} />
                <div className="grid grid-cols-[1fr_6rem] gap-2">
                  <Input label="Name" name="name" defaultValue={c.name} />
                  <Input label="Soft cap" name="soft_cap" type="number" defaultValue={c.soft_cap?.toString()} />
                </div>
                <Input label="Nudge when full" name="nudge" defaultValue={c.nudge} />
                <div className="flex items-center justify-between">
                  <button className="btn btn-primary py-1.5">Save</button>
                  <ConfirmButton action={A.deleteCategory.bind(null, slug, c.id)} confirm={`Delete ${c.name} and every dish in it?`}>
                    Delete category
                  </ConfirmButton>
                </div>
              </form>
            ))}
            <form action={A.addCategory.bind(null, slug)} className="flex gap-2">
              <input name="name" placeholder="New category" className="field py-1.5" />
              <input name="soft_cap" type="number" placeholder="Cap" className="field w-20 py-1.5" />
              <button className="btn btn-primary py-1.5">Add</button>
            </form>
          </div>
        </details>

        <details className="mt-4 border-t border-line pt-4">
          <summary className="cursor-pointer text-[17px] font-medium">Kitchen</summary>
          {(() => {
            const oven = board.kitchen.find((k) => k.kind === "oven");
            return (
              <form action={A.updateKitchen.bind(null, slug)} className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Ovens" name="ovens" type="number" defaultValue={String(oven?.quantity ?? 1)} />
                  <Input label="Dishes per oven at once" name="capacity" type="number" defaultValue={String(oven?.capacity ?? 2)} />
                </div>
                <button className="btn btn-primary w-full">Save kitchen</button>
              </form>
            );
          })()}
        </details>
      </Card>
    </main>
  );
}


function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper px-5 py-5">
      <h2 className="smallcaps mb-3 text-[17px] text-maroon">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-[34px] leading-none font-semibold text-maroon tabular-nums">{n}</div>
      <div className="mt-1 text-[14px] text-muted">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    yes: ["Coming", "bg-[#eef3e6] text-ok"],
    maybe: ["Maybe", "bg-[#fff2d6] text-[#8a6212]"],
    no: ["Not coming", "bg-line/60 text-muted"],
    invited: ["Hasn’t replied", "bg-line/60 text-muted"],
  };
  const [l, c] = map[status] ?? [status, ""];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[13px] ${c}`}>{l}</span>;
}

function Input({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue?: string | null; type?: string }) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-muted">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} className="field mt-1 py-1.5" />
    </label>
  );
}

function Area({ label, name, defaultValue, rows }: { label: string; name: string; defaultValue?: string | null; rows: number }) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-muted">{label}</span>
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? ""} className="field mt-1 py-1.5" />
    </label>
  );
}
