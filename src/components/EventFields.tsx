/* eslint-disable @next/next/no-img-element */
import { DetailsInput } from "@/components/DetailsInput";
import type { Event } from "@/lib/types";

/** The fields that describe an event. Shared by "New event" and "Edit event". */
export function EventFields({ event }: { event?: Event }) {
  return (
    <>
      <Field label="Title" name="title" value={event?.title} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" name="date" type="date" value={event?.date} required />
        <Field label="Time" name="time" type="time" value={event?.time?.slice(0, 5)} />
      </div>
      <Field label="Place" name="place" value={event?.place} placeholder="e.g. The Fords'" />
      <Field label="Address" name="address" value={event?.address} />
      <DetailsInput value={event?.details ?? ""} />
      <Field label="Reply by" name="rsvp_by" type="date" value={event?.rsvp_by} />
      <Field label="Cover image URL (optional)" name="cover_url" value={event?.cover_url} />
      {event?.cover_url && <img src={event.cover_url} alt="Current cover" className="h-auto w-32 rounded-lg" />}
      <Field
        label="“What are you bringing?” question (blank = no bring list)"
        name="bring_prompt" value={event?.bring_prompt} placeholder="e.g. What's your main dish?"
      />
      <label className="flex items-center gap-3 py-1 text-[16px]">
        <input type="checkbox" name="ask_kids" defaultChecked={event?.ask_kids ?? true} className="h-5 w-5" />
        Ask how many kids are coming
      </label>
    </>
  );
}

export function Field({
  label, name, value, type = "text", required, placeholder,
}: { label: string; name: string; value?: string | null; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[15px] text-soft">{label}</span>
      <input name={name} type={type} defaultValue={value ?? ""} required={required} placeholder={placeholder} className="field mt-1" />
    </label>
  );
}
