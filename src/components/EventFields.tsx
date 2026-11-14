import { BringSection } from "@/components/BringSection";
import { CoverInput } from "@/components/CoverInput";
import { DetailsInput } from "@/components/DetailsInput";
import { FormDraft } from "@/components/FormDraft";
import type { Event } from "@/lib/types";

/** The fields that describe an event. Shared by "New event" and "Edit event". */
/** `moreOptions` goes inside "More options" (the New event form adds the web address there). */
export function EventFields({ event, moreOptions }: { event?: Event; moreOptions?: React.ReactNode }) {
  return (
    <>
      <FormDraft id={event ? `edit:${event.slug}` : "new"} />
      <Field label="Title" name="title" value={event?.title} required />
      <Field label="Date" name="date" type="date" value={event?.date} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" name="time" type="time" value={event?.time?.slice(0, 5)} />
        <Field label="Ends (optional)" name="end_time" type="time" value={event?.end_time?.slice(0, 5)} />
      </div>
      <Field label="Place" name="place" value={event?.place} placeholder="e.g. The Fords'" />
      <Field label="Address" name="address" value={event?.address} />
      <DetailsInput value={event?.details ?? ""} />
      {/* Upload shows once Vercel Blob storage is connected (BLOB_READ_WRITE_TOKEN). */}
      <CoverInput value={event?.cover_url ?? null} canUpload={!!process.env.BLOB_READ_WRITE_TOKEN || process.env.PHOTOS_FAKE === "true"} />
      <BringSection prompt={event?.bring_prompt ?? null} allowOwn={event?.allow_own ?? true} allowDoubles={event?.allow_doubles ?? false} newEvent={!event} />
      <details className="rounded-2xl border border-line bg-white px-4 py-3">
        <summary className="text-[16px] font-semibold">More options</summary>
        <div className="mt-3 space-y-3">
          <Field label="RSVP deadline" name="rsvp_by" type="date" value={event?.rsvp_by} />
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
          <label className="block">
            <span className="text-[15px] text-soft">Schedule (for all-day events)</span>
            <textarea name="schedule" defaultValue={event?.schedule ?? ""} rows={4} className="field mt-1"
              placeholder={"10am Bagels & coffee\n1pm Snacks & wine\n4:30pm Dinner"} />
            <span className="text-[14px] text-soft">One per line, time first. The one at your start time is the main one.</span>
          </label>
          <Check name="ask_arrival" checked={event?.ask_arrival ?? false} label="Ask guests when they're arriving (needs a schedule)" />
          <Check name="ask_kids" checked={event?.ask_kids ?? false} label="Ask how many kids are coming" />
          <Check name="notify_host" checked={event?.notify_host ?? false} label="Email me when someone replies" />
          {moreOptions}
        </div>
      </details>
    </>
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
