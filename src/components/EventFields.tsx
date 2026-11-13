import { CoverInput } from "@/components/CoverInput";
import { DetailsInput } from "@/components/DetailsInput";
import type { Event } from "@/lib/types";

/** The fields that describe an event. Shared by "New event" and "Edit event". */
/** `afterBring` sits under the bring question; `moreOptions` goes inside "More options". */
export function EventFields({ event, afterBring, moreOptions }: { event?: Event; afterBring?: React.ReactNode; moreOptions?: React.ReactNode }) {
  return (
    <>
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
      <Field
        label="“What are you bringing?” question (blank = no bring list)"
        name="bring_prompt" value={event?.bring_prompt} placeholder="e.g. Bringing anything?"
      />
      {afterBring}
      <details className="rounded-2xl border border-line bg-white px-4 py-3">
        <summary className="text-[16px] font-semibold">More options</summary>
        <div className="mt-3 space-y-3">
          <Field label="RSVP deadline" name="rsvp_by" type="date" value={event?.rsvp_by} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Note question" name="note_prompt" value={event?.note_prompt} placeholder="Anything we should know?" />
            <Field label="Its example" name="note_hint" value={event?.note_hint} placeholder="Allergies, arriving late…" />
          </div>
          <Check name="allow_doubles" checked={event?.allow_doubles ?? false} label="Let people bring the same thing" />
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
