"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { saveRsvp, type DishInput } from "@/app/actions";
import { singular } from "@/lib/menu";
import { ARRIVALS, KITCHEN_NEEDS, type Arrival, type Category, type KitchenNeed, type RsvpStatus, type Slot } from "@/lib/types";

export interface FormDish extends DishInput {
  key: string;
  assigned_by_host?: boolean;
}

export interface RsvpFormProps {
  slug: string;
  dishDeadline: string | null; // already formatted, e.g. "Fri, Nov 20"
  categories: (Category & { othersCount: number })[];
  slots: Slot[];
  takenSlots: Record<string, string>; // slot id → name of the other guest who has it
  initial?: {
    token: string;
    name: string;
    status: RsvpStatus;
    adults: number;
    kids: number;
    dietary_notes: string | null;
    arrival_window: Arrival | null;
    dishes: FormDish[];
  };
  preselectSlot?: string;
  hostName?: string;
  maxDishes: number;
}

let keySeq = 0;
const newKey = () => `new-${++keySeq}`;

export function RsvpForm(props: RsvpFormProps) {
  const { categories, slots, takenSlots, initial } = props;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);

  const coreCat = categories.find((c) => c.kind === "core");
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<RsvpStatus | null>(initial ? initial.status : null);
  const [adults, setAdults] = useState(initial?.adults ?? 1);
  const [kids, setKids] = useState(initial?.kids ?? 0);
  const [arrival, setArrival] = useState<Arrival | null>(initial?.arrival_window ?? null);
  const [dietary, setDietary] = useState(initial?.dietary_notes ?? "");
  const [dishes, setDishes] = useState<FormDish[]>(() => {
    if (initial) return initial.dishes;
    const slot = slots.find((s) => s.id === props.preselectSlot && !takenSlots[s.id]);
    return slot ? [blankDish(slot.category_id, slot.id)] : [];
  });
  const [picking, setPicking] = useState(false);

  const mySlots = new Set(dishes.map((d) => d.slot_id).filter(Boolean));
  const openSlots = slots.filter((s) => !takenSlots[s.id] && !mySlots.has(s.id));
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of categories) m[c.id] = c.othersCount + dishes.filter((d) => d.category_id === c.id).length;
    return m;
  }, [categories, dishes]);

  function add(category_id: string, slot_id?: string) {
    setDishes((ds) => [...ds, blankDish(category_id, slot_id)]);
    setPicking(false);
  }
  function update(key: string, patch: Partial<FormDish>) {
    setDishes((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }
  function remove(key: string) {
    setDishes((ds) => ds.filter((d) => d.key !== key));
  }

  function submit(e: React.FormEvent, differentPerson = false) {
    e.preventDefault();
    setError(null);
    setDuplicate(false);
    if (!name.trim()) return setError("Please add your name.");
    if (!status) return setError("Please let us know if you’re coming.");
    for (const d of dishes) {
      if (d.kitchen_needs.includes("oven") && (!d.oven_temp_f || !d.oven_minutes)) {
        return setError(`Please add the oven temperature and time for ${label(d)}.`);
      }
    }
    start(async () => {
      const res = await saveRsvp({
        slug: props.slug,
        token: initial?.token,
        name, status, adults, kids,
        dietary_notes: dietary,
        arrival_window: arrival,
        dishes: dishes.map(toInput),
        differentPerson,
      });
      if (!res.ok) {
        setError(res.error);
        setDuplicate(!!res.duplicate);
        router.refresh();
        return;
      }
      router.push(`/${props.slug}/me/${res.token}?saved=1`);
      router.refresh();
    });
  }

  function label(d: FormDish) {
    if (d.dish_name) return d.dish_name;
    if (d.slot_id) return slots.find((s) => s.id === d.slot_id)?.name ?? "your dish";
    return `your ${singular(categories.find((c) => c.id === d.category_id)?.name ?? "dish").toLowerCase()}`;
  }

  const coming = status === "yes" || status === "maybe";

  return (
    <form onSubmit={submit} className="space-y-7">
      <Field label={initial ? "Name" : "Your name"} hint="Couples and families: put both names, e.g. “Madi & Max”.">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Name(s)" />
      </Field>

      <Field label="Will you join us?">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["yes", "Yes, wouldn’t miss it"],
              ["maybe", "Maybe"],
              ["no", "Can’t make it"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={status === v} onClick={() => setStatus(v)}>
              {l}
            </button>
          ))}
        </div>
      </Field>

      {coming && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Stepper label="Adults" value={adults} min={1} onChange={setAdults} />
            <Stepper label="Kids" value={kids} min={0} onChange={setKids} />
          </div>

          <Field label="When will you get there?" hint="Roughly. Come and go as you please.">
            <div className="flex flex-wrap gap-2">
              {ARRIVALS.map((a) => (
                <button
                  key={a.value} type="button" className="chip" aria-pressed={arrival === a.value}
                  onClick={() => setArrival(arrival === a.value ? null : a.value)}
                >
                  {a.label}
                  {a.hint && <span className="opacity-70"> · {a.hint}</span>}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Allergies or dietary needs" hint="For anyone in your party. Leave blank if none.">
            <input className="field" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="e.g. vegetarian, nut allergy" />
          </Field>

          <div>
            <h3 className="smallcaps text-[17px] text-maroon">What you’re bringing</h3>
            <p className="text-[15px] italic text-muted">
              {props.maxDishes === 2
                ? "Less is more: one dish, and a drink or dessert if you like. "
                : `Up to ${props.maxDishes} items, please. `}
              Homemade only, please. Don’t know the exact dish yet? Pick a category now and name it
              {props.dishDeadline ? ` by ${props.dishDeadline}` : " later"}.
            </p>

            <div className="mt-3 space-y-4">
              {dishes.map((d) => (
                <DishCard
                  key={d.key}
                  dish={d}
                  category={categories.find((c) => c.id === d.category_id)}
                  slot={slots.find((s) => s.id === d.slot_id)}
                  hostName={props.hostName}
                  takenBy={d.slot_id && !d.assigned_by_host ? takenSlots[d.slot_id] : undefined}
                  onChange={(p) => update(d.key, p)}
                  onRemove={() => remove(d.key)}
                />
              ))}
            </div>

            {dishes.length >= props.maxDishes ? (
              <p className="mt-4 text-center text-[15px] italic text-muted">That’s plenty. Thank you!</p>
            ) : !picking ? (
              <button type="button" onClick={() => setPicking(true)} className="btn btn-ghost mt-4 w-full text-maroon">
                + {dishes.length ? "Add another dish" : "Add a dish"}
              </button>
            ) : (
              <div className="mt-4 rounded-md border border-line bg-white p-4">
                {openSlots.length > 0 && coreCat && (
                  <>
                    <p className="smallcaps text-[14px] text-maroon">Still needed: the main dishes</p>
                    <p className="text-[14px] italic text-muted">These help the most.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {openSlots.map((s) => (
                        <button key={s.id} type="button" className="chip border-gold bg-[#fff7e3]" onClick={() => add(s.category_id, s.id)}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                    <div className="my-4 h-px bg-line" />
                  </>
                )}
                <p className="smallcaps text-[14px] text-maroon">Or something else</p>
                <div className="mt-2 space-y-2">
                  {categories
                    .filter((c) => c.kind === "open")
                    .map((c) => {
                      const n = counts[c.id];
                      const full = c.soft_cap != null && n >= c.soft_cap;
                      return (
                        <button
                          key={c.id} type="button" onClick={() => add(c.id)}
                          className="block w-full rounded-md border border-line px-3 py-2 text-left"
                        >
                          <span className="flex items-baseline justify-between">
                            <span className="text-[17px] font-medium">{c.name}</span>
                            <span className={`text-[14px] ${full ? "font-semibold text-alert" : "text-muted"}`}>
                              {n}
                              {c.soft_cap ? ` of ~${c.soft_cap}` : ""}
                            </span>
                          </span>
                          {full && c.nudge && <span className="mt-0.5 block text-[14px] italic text-alert">{c.nudge}</span>}
                        </button>
                      );
                    })}
                </div>
                <button type="button" onClick={() => setPicking(false)} className="mt-3 text-[15px] text-muted underline">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {status === "no" && (
        <p className="text-[17px] italic text-muted">
          We’ll miss you!{initial?.dishes.length ? " Saving this will release the dishes you’d claimed." : ""}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-alert/10 p-3 text-[16px] text-alert">
          {error}
          {duplicate && (
            <button type="button" onClick={(e) => submit(e, true)} className="mt-2 block underline">
              We’re a different person with the same name. RSVP anyway.
            </button>
          )}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-4 text-[16px]">
        {pending ? "Saving…" : initial ? "Save changes" : "Send RSVP"}
      </button>
    </form>
  );
}

function toInput(d: FormDish): DishInput {
  return {
    id: d.id, category_id: d.category_id, slot_id: d.slot_id, dish_name: d.dish_name, kitchen_needs: d.kitchen_needs,
    oven_temp_f: d.oven_temp_f, oven_minutes: d.oven_minutes, timing: d.timing, notes: d.notes,
  };
}

function blankDish(category_id: string, slot_id?: string): FormDish {
  return { key: newKey(), category_id, slot_id: slot_id ?? null, dish_name: "", kitchen_needs: [], timing: "before" };
}

function DishCard({
  dish, category, slot, hostName, takenBy, onChange, onRemove,
}: {
  takenBy?: string;
  dish: FormDish;
  category?: Category;
  slot?: Slot;
  hostName?: string;
  onChange: (p: Partial<FormDish>) => void;
  onRemove: () => void;
}) {
  const title = slot ? slot.name : category?.name ? singular(category.name) : "Dish";
  const needs = dish.kitchen_needs;
  const toggle = (n: KitchenNeed) => {
    let next = needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n];
    if (n === "ready" && !needs.includes("ready")) next = ["ready", ...(needs.includes("fridge") ? (["fridge"] as KitchenNeed[]) : [])];
    else if (n !== "ready" && n !== "fridge") next = next.filter((x) => x !== "ready");
    onChange({ kitchen_needs: next });
  };
  const placeholder = slot
    ? `e.g. your take on ${slot.name.toLowerCase()} (optional)`
    : category?.name === "Desserts" ? "e.g. Apple pie" : category?.name === "Drinks" ? "e.g. Batched manhattans" : category?.name === "Apps" ? "e.g. Goat cheese stuffed dates" : "Dish name";

  return (
    <div className="rounded-md border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="smallcaps text-[13px] text-muted">{slot ? "Main dish" : category?.name}</p>
          <p className="text-[19px] font-semibold leading-tight">{title}</p>
          {dish.assigned_by_host && (
            <p className="mt-0.5 text-[14px] italic text-muted">{hostName ?? "The hosts"} asked you to bring this. Thank you!</p>
          )}
        </div>
        {!dish.assigned_by_host && (
          <button type="button" onClick={onRemove} className="text-[14px] text-muted underline" aria-label={`Remove ${title}`}>
            Remove
          </button>
        )}
      </div>

      {takenBy && (
        <p className="mt-2 rounded bg-alert/10 p-2 text-[15px] text-alert">
          {takenBy} just claimed this one. Please remove it and pick something else.
        </p>
      )}
      <input
        className="field mt-3" value={dish.dish_name ?? ""} placeholder={placeholder}
        onChange={(e) => onChange({ dish_name: e.target.value })}
        aria-label="Dish name"
      />
      {!slot && !dish.dish_name?.trim() && (
        <p className="mt-1 text-[14px] italic text-muted">Leave blank for now and it’ll show as “{title} (TBD)”.</p>
      )}

      {category?.name !== "Drinks" && (
        <div className="mt-4">
          <p className="text-[15px] font-medium">What will it need in the kitchen?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {KITCHEN_NEEDS.map((n) => (
              <button key={n.value} type="button" className="chip" aria-pressed={needs.includes(n.value)} onClick={() => toggle(n.value)}>
                {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {needs.includes("oven") && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[15px] font-medium">Temperature (°F)</span>
            <input
              className="field mt-1" inputMode="numeric" placeholder="350"
              value={dish.oven_temp_f ?? ""}
              onChange={(e) => onChange({ oven_temp_f: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })}
            />
          </label>
          <label className="block">
            <span className="text-[15px] font-medium">Minutes</span>
            <input
              className="field mt-1" inputMode="numeric" placeholder="30"
              value={dish.oven_minutes ?? ""}
              onChange={(e) => onChange({ oven_minutes: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })}
            />
          </label>
        </div>
      )}

      {(needs.includes("oven") || needs.includes("stovetop") || needs.includes("outlet")) && (
        <div className="mt-4">
          <p className="text-[15px] font-medium">When?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={dish.timing !== "after"} onClick={() => onChange({ timing: "before" })}>
              Ready for dinner
            </button>
            <button type="button" className="chip" aria-pressed={dish.timing === "after"} onClick={() => onChange({ timing: "after" })}>
              After dinner (dessert)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[17px] font-semibold">{label}</label>
      {hint && <p className="text-[15px] italic text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="text-[17px] font-semibold">{label}</p>
      <div className="mt-2 flex items-center rounded-md border border-line bg-white">
        <button type="button" className="h-11 w-11 text-[22px] text-maroon disabled:opacity-30" disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label.toLowerCase()}`}>−</button>
        <span className="flex-1 text-center text-[19px] tabular-nums">{value}</span>
        <button type="button" className="h-11 w-11 text-[22px] text-maroon" onClick={() => onChange(Math.min(20, value + 1))}
          aria-label={`More ${label.toLowerCase()}`}>+</button>
      </div>
    </div>
  );
}
