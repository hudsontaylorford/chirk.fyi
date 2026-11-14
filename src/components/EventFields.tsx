import { BringFields, type ListItem } from "@/components/BringFields";
import { CoverInput } from "@/components/CoverInput";
import { DetailsInput } from "@/components/DetailsInput";
import { FormDraft } from "@/components/FormDraft";
import { shortDate, when } from "@/lib/format";
import { parseSchedule } from "@/lib/schedule";
import type { Event } from "@/lib/types";

/**
 * The event form, shared by New event and Edit event so the two always match: the essentials first,
 * then one row per optional part, each showing its current setting and opening on a tap.
 * Closed rows keep their fields, so nothing typed in them is lost.
 */
export function EventFields({ event, needed = [] }: { event?: Event; needed?: ListItem[] }) {
  const stages = parseSchedule(event?.schedule ?? null, event?.time ?? null).length;
  const extras = [
    event?.notes_public && "notes on invite",
    event?.max_guests != null && (event.max_guests === 0 ? "no extra guests" : `up to ${event.max_guests} extra`),
    event?.ask_kids && "kids",
    event?.notify_host && "email me",
  ].filter(Boolean);

  const basics = (
    <div className="space-y-3">
      <Field label="Title" name="title" value={event?.title} required />
      <Field label="Date" name="date" type="date" value={event?.date} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" name="time" type="time" value={event?.time?.slice(0, 5)} />
        <Field label="Ends (optional)" name="end_time" type="time" value={event?.end_time?.slice(0, 5)} />
      </div>
      <Field label="Place" name="place" value={event?.place} placeholder="e.g. The Fords'" />
      <Field label="Address" name="address" value={event?.address} />
      <Field label="Hosted by (optional)" name="hosted_by" value={event?.hosted_by} placeholder="e.g. Hudson & Molly" />
      <Check name="long_times" checked={event?.long_times ?? false} label="Show times like 3:00 PM (instead of 3 pm)" />
    </div>
  );

  return (
    <>
      <FormDraft id={event ? `edit:${event.slug}` : "new"} />
      {/* New events start with the essentials open (they're required); existing ones show them as a row. */}
      {!event && basics}
      <div className="divide-y divide-line rounded-2xl border border-line bg-white">
        {event && (
          <Row id="basics" label="Basics" value={[when(event), event.place].filter(Boolean).join(" · ")}>{basics}</Row>
        )}
        <Row id="details" label="Message" value={event?.details ? event.details.replace(/[#*\-]/g, "").trim().slice(0, 40) + "…" : "Add one"}>
          <DetailsInput value={event?.details ?? ""} />
        </Row>
        <Row id="photo" label="Photo" value={event?.cover_url ? "Added" : "Add one"}>
          {/* Upload shows once Vercel Blob storage is connected (BLOB_READ_WRITE_TOKEN). */}
          <CoverInput value={event?.cover_url ?? null} canUpload={!!process.env.BLOB_READ_WRITE_TOKEN || process.env.PHOTOS_FAKE === "true"} />
        </Row>
        <Row id="bring" label="What to bring" value={event?.bring_prompt ? `On · ${needed.length} on the list` : "Off"}>
          <BringFields prompt={event?.bring_prompt ?? null} allowOwn={event?.allow_own ?? true} allowDoubles={event?.allow_doubles ?? false} items={needed} />
        </Row>
        <Row id="schedule" label="Schedule" value={stages ? `${stages} parts` : "For all-day events"}>
          <label className="block">
            <textarea name="schedule" defaultValue={event?.schedule ?? ""} rows={4} className="field" aria-label="Schedule"
              placeholder={"10am Bagels & coffee\n1pm Snacks & wine\n4:30pm Dinner"} />
            <span className="text-[14px] text-soft">One per line, time first. The one at your start time is the main one.</span>
          </label>
          <Check name="ask_arrival" checked={event?.ask_arrival ?? false} label="Ask guests when they're arriving" />
        </Row>
        <Row id="reply-by" label="Reply by" value={event?.rsvp_by ? shortDate(event.rsvp_by) : "No deadline"}>
          <Field label="Reply deadline" name="rsvp_by" type="date" value={event?.rsvp_by} />
        </Row>
        <Row id="guests" label="Guest options" value={extras.length ? extras.join(", ").replace(/^./, (c) => c.toUpperCase()) : "Notes, plus-ones"}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Note question" name="note_prompt" value={event?.note_prompt} placeholder="Anything we should know?" />
            <Field label="Its example" name="note_hint" value={event?.note_hint} placeholder="Allergies, arriving late…" />
          </div>
          <Check name="notes_public" checked={event?.notes_public ?? false} label="Show notes on the invite (otherwise only you see them)" />
          <label className="block">
            <span className="text-[15px] text-soft">Extra guests per reply</span>
            <select name="max_guests" defaultValue={event?.max_guests ?? ""} className="field mt-1">
              <option value="">No limit</option>
              <option value="0">None (just the person replying)</option>
              <option value="1">Up to 1 (a plus-one)</option>
              <option value="2">Up to 2</option>
              <option value="3">Up to 3</option>
              <option value="4">Up to 4</option>
            </select>
          </label>
          <Check name="ask_kids" checked={event?.ask_kids ?? false} label="Ask how many kids are coming" />
          <Check name="notify_host" checked={event?.notify_host ?? false} label="Email me when someone replies" />
        </Row>
        {!event && (
          <Row id="address" label="Web address" value="Made from the title">
            <Field label="chirk.fyi/…" name="slug" placeholder="e.g. molly-birthday" />
          </Row>
        )}
      </div>
    </>
  );
}

/** One optional part of the event: a single line with its current setting; tap to open. */
function Row({ id, label, value, children }: { id: string; label: string; value: string; children: React.ReactNode }) {
  return (
    <details id={id} className="group px-4">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 text-[16px] font-semibold">{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-[15px] text-soft">
          <span className="truncate">{value}</span>
          <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
        </span>
      </summary>
      <div className="space-y-3 pb-4">{children}</div>
    </details>
  );
}

export function Field({
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
