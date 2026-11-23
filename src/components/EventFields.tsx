import { BringFields, type ListItem } from "@/components/BringFields";
import { CoverInput } from "@/components/CoverInput";
import { DetailsInput } from "@/components/DetailsInput";
import { FormDraft } from "@/components/FormDraft";
import { PlaceFields } from "@/components/PlaceFields";
import { placesOn } from "@/lib/places-provider";
import { shortDate, when } from "@/lib/format";
import { MAX_QUESTIONS } from "@/lib/poll";
import { parseSchedule } from "@/lib/schedule";
import type { Template } from "@/lib/templates";
import type { Event } from "@/lib/types";

/**
 * The event form, shared by New event and Edit event so the two always match: the essentials first,
 * then one row per optional part, each showing its current setting and opening on a tap.
 * Closed rows keep their fields, so nothing typed in them is lost.
 */
export function EventFields({ event, start, needed = [], matches = [] }: { event?: Event; start?: Template; needed?: ListItem[]; matches?: string[] }) {
  const e: Partial<Event> | undefined = event ?? start?.set; // a new event can start from a template's settings
  const stages = parseSchedule(e?.schedule ?? null, e?.time ?? null).length;
  const extras = [
    e?.notes_public && "notes on invite",
    e?.hide_guests && "guest list hidden",
    e?.max_guests != null && (e.max_guests === 0 ? "no extra guests" : `up to ${e.max_guests} extra`),
    e?.ask_kids && "kids",
    e?.notify_host && "email me",
  ].filter(Boolean);

  const basics = (
    <div className="space-y-3">
      <Field label="Title" name="title" value={e?.title} required />
      <Field label="Date" name="date" type="date" value={e?.date} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" name="time" type="time" value={e?.time?.slice(0, 5)} />
        <Field label="Ends (optional)" name="end_time" type="time" value={e?.end_time?.slice(0, 5)} />
      </div>
      <PlaceFields place={e?.place ?? null} address={e?.address ?? null} search={placesOn()} />
      <Field label="Hosted by (optional)" name="hosted_by" value={e?.hosted_by} placeholder="e.g. Hudson & Molly" />
    </div>
  );

  const advanced = [
    {
      label: "Schedule",
      on: !!e?.schedule || !!e?.ask_arrival,
      row: (
                <Row key="schedule" id="schedule" label="Schedule" value={stages ? `${stages} part${stages === 1 ? "" : "s"}` : "Add one"}>
                  <label className="block">
                    <textarea name="schedule" defaultValue={e?.schedule ?? ""} rows={4} className="field" aria-label="Schedule"
                      placeholder={"2 pm Arrive\n3 pm The main part\n6 pm Wrap up"} />
                    <span className="text-[14px] text-soft">One per line, time first. The one at your start time is the main one.</span>
                  </label>
                  <Check name="ask_arrival" checked={e?.ask_arrival ?? false} label="Ask guests which parts they're coming to" />
                  <Check name="long_times" checked={e?.long_times ?? false} label="Write times as 3:00 PM" />
                </Row>
      ),
    },
    {
      label: "Questions",
      on: !!e?.questions?.length,
      row: (
        <Row key="questions" id="questions" label="Questions" value={e?.questions?.length ? e.questions.map((x) => x.q).join(" · ") : "Add one"}>
          {/* All 4 slots; an empty one stays hidden until the question above it has text, so the next appears as you type. */}
          {Array.from({ length: MAX_QUESTIONS }, (_, i) => e?.questions?.[i] ?? { q: "", choices: [], one: false }).map((x, i) => (
            <div key={i} className={`space-y-3 ${i ? "border-t border-line pt-4 [div:has(input:placeholder-shown)+&:has(input:placeholder-shown)]:hidden" : ""}`}>
              <Field label={i ? "Another question (optional)" : "Question"} name={`question_${i}`} value={x.q} placeholder={i ? "e.g. Which size?" : "e.g. Which day works?"} />
              <label className="block">
                <span className="text-[15px] text-soft">Choices</span>
                <textarea name={`choices_${i}`} defaultValue={x.choices.join("\n")} rows={4} className="field mt-1" aria-label={`Choices for question ${i + 1}`} placeholder={"Option one\nOption two\nOption three"} />
                <span className="text-[14px] text-soft">One per line, up to 20. Guests pick when they reply; the invite shows the counts. Leave empty for a tick box that opens a box to write in (only you see those).</span>
              </label>
              <Check name={`one_${i}`} checked={x.one} label="Guests pick just one" />
            </div>
          ))}
        </Row>
      ),
    },
    {
      label: "Guest options",
      on: extras.length > 0 || !!e?.note_prompt || !!e?.note_hint,
      row: (
        <Row key="guests" id="guests" label="Guest options" value={extras.length ? extras.join(", ").replace(/^./, (c) => c.toUpperCase()) : "Notes, plus-ones"}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Note question" name="note_prompt" value={e?.note_prompt} placeholder="Anything we should know?" />
            <Field label="Its example" name="note_hint" value={e?.note_hint} placeholder="Allergies, arriving late…" />
          </div>
          <Check name="notes_public" checked={e?.notes_public ?? false} label="Show notes on the invite (otherwise only you see them)" />
          <Check name="hide_guests" checked={e?.hide_guests ?? false} label="Hide who’s coming (only you see the list)" />
          <label className="block">
            <span className="text-[15px] text-soft">Extra guests per reply</span>
            <select name="max_guests" defaultValue={e?.max_guests ?? ""} className="field mt-1">
              <option value="">No limit</option>
              <option value="0">None (just the person replying)</option>
              <option value="1">Up to 1 (a plus-one)</option>
              <option value="2">Up to 2</option>
              <option value="3">Up to 3</option>
              <option value="4">Up to 4</option>
            </select>
          </label>
          <Check name="ask_kids" checked={e?.ask_kids ?? false} label="Ask how many kids are coming" />
          <Check name="notify_host" checked={e?.notify_host ?? false} label="Email me when someone replies" />
        </Row>
      ),
    },
    {
      label: "Shared costs",
      on: !!(e?.costs_on || e?.poker_on),
      row: (
        <Row key="costs" id="costs" label="Shared costs" value={[e?.costs_on && "Split costs", e?.poker_on && "Poker"].filter(Boolean).join(" · ") || "Off"}>
          <Check name="costs_on" checked={e?.costs_on ?? false} label="Split costs (who paid what, who owes whom)" />
          <Check name="poker_on" checked={e?.poker_on ?? false} label="Poker night (buy-ins and cash-outs)" />
          <p className="text-[14px] text-soft">Everyone on the guest list (unless they said they can&apos;t make it) can add what they paid, no reply needed. chirk works out who owes whom and links to Venmo; no money goes through chirk.</p>
        </Row>
      ),
    },
    {
      label: "Gift exchange",
      on: !!e?.gift_on,
      row: (
        <Row key="gifts" id="gifts" label="Gift exchange" value={e?.gift_on ? (e.gift_budget ? `On · ${e.gift_budget}` : "On") : "Off"}>
          <Check name="gift_on" checked={e?.gift_on ?? false} label="Draw names for a gift exchange" />
          <Field label="Budget (optional)" name="gift_budget" value={e?.gift_budget} placeholder="e.g. $30" />
          <label className="block">
            <span className="text-[15px] text-soft">Rules (optional, everyone in it sees them)</span>
            <textarea name="gift_rules" defaultValue={e?.gift_rules ?? ""} rows={3} className="field mt-1" aria-label="Gift rules"
              placeholder="e.g. Something homemade or secondhand. Bring it wrapped, with a tag." />
          </label>
          <Field label="Draw names automatically on (optional, 9 am)" name="gift_draw_on" type="date" value={e?.gift_draw_on} />
          <Check name="gift_remind_ideas" checked={e?.gift_remind_ideas ?? true} label="Remind people to add gift ideas, 3 days before the draw" />
          <Check name="gift_remind_givers" checked={e?.gift_remind_givers ?? true} label="Remind everyone who they're giving to, a week before the event" />
          <p className="text-[14px] text-soft">Choose who&apos;s in and draw names on this page once it&apos;s on. Each person only ever sees their own match.</p>
          {matches.length > 0 && (
            // Tucked away for sorting out a problem (a lost match, a mix-up), so hosts in the exchange aren't spoiled by accident.
            <details className="text-[15px]">
              <summary className="cursor-pointer text-soft">Trouble with the draw? See every match (spoils the surprise)</summary>
              <ul className="mt-1 space-y-1">{matches.map((m) => <li key={m}>{m}</li>)}</ul>
            </details>
          )}
        </Row>
      ),
    },
    ...(event ? [] : [{
      label: "Web address",
      on: false,
      row: (
        <Row key="address" id="address" label="Web address" value="Made from the title">
          <Field label="chirk.fyi/…" name="slug" placeholder="e.g. saturday-plans" />
        </Row>
      ),
    }]),
  ];

  return (
    <>
      <FormDraft id={event ? `edit:${event.slug}` : start ? `new:${start.id}` : "new"} />
      {/* New events start with the essentials open (they're required); existing ones show them as a row. */}
      {!event && basics}
      <div className="divide-y divide-line border-y border-line">
        {event && (
          <Row id="basics" label="Basics" value={[when(event), event.place].filter(Boolean).join(" · ")}>{basics}</Row>
        )}
        <Row id="details" label="Message" value={e?.details ? e.details.replace(/[#*\-]/g, "").trim().slice(0, 40) + "…" : "Add one"}>
          <DetailsInput value={e?.details ?? ""} />
        </Row>
        <Row id="photo" label="Photo" value={e?.cover_url ? (e.theme ? "Added · color matched" : "Added") : "Add one"}>
          {/* Upload shows once Vercel Blob storage is connected (BLOB_READ_WRITE_TOKEN). */}
          <CoverInput value={e?.cover_url ?? null} theme={e?.theme ?? null} canUpload={!!process.env.BLOB_READ_WRITE_TOKEN || process.env.PHOTOS_FAKE === "true"} />
        </Row>
        <Row id="bring" label="What to bring" value={e?.bring_prompt ? `On · ${needed.length} on the list` : "Off"}>
          <BringFields prompt={e?.bring_prompt ?? null} allowOwn={e?.allow_own ?? true} allowDoubles={e?.allow_doubles ?? false} items={needed} />
        </Row>
        <Row id="reply-by" label="Reply by" value={e?.rsvp_by ? shortDate(e.rsvp_by) : "No deadline"}>
          <Field label="Reply deadline" name="rsvp_by" type="date" value={e?.rsvp_by} />
          <Check name="remind_replies" checked={e?.remind_replies ?? false} label="Email a reminder to anyone who hasn't replied, 3 days before" />
        </Row>
        {/* Rows most chirks don't need wait under "More options"; one that's switched on always shows. */}
        {advanced.filter((r) => r.on).map((r) => r.row)}
        {advanced.some((r) => !r.on) && (
          <Row id="more" label="More options" value={advanced.filter((r) => !r.on).map((r) => r.label).join(", ")}>
            <div className="-mb-4 divide-y divide-line border-t border-line pl-4">{advanced.filter((r) => !r.on).map((r) => r.row)}</div>
          </Row>
        )}
      </div>
    </>
  );
}

/** One optional part of the event: a single line with its current setting; tap to open. */
function Row({ id, label, value, children }: { id: string; label: string; value: string; children: React.ReactNode }) {
  return (
    <details id={id}>
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-[16px] font-semibold">{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-[15px] text-soft">
          <span className="truncate">{value}</span>
          <span aria-hidden className="transition-transform [details[open]>summary_&]:rotate-90">›</span>
        </span>
      </summary>
      <div className="space-y-3 pb-4">{children}</div>
    </details>
  );
}

function Field({
  label, name, value, type = "text", required, placeholder,
}: { label: string; name: string; value?: string | null; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block min-w-0">
      <span className="text-[15px] text-soft">{label}</span>
      <input name={name} type={type} defaultValue={value ?? ""} required={required} placeholder={placeholder} className="field mt-1" />
    </label>
  );
}

function Check({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="flex items-center gap-3 py-1 text-[16px]">
      <input type="checkbox" name={name} defaultChecked={checked} className="h-5 w-5 shrink-0" />
      {label}
    </label>
  );
}
