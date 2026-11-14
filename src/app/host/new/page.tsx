import Link from "next/link";
import { redirect } from "next/navigation";
import { EventFields } from "@/components/EventFields";
import { SaveButton } from "@/components/SaveButton";
import { isHost } from "@/lib/auth";
import { createEvent } from "../../[slug]/host/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "New event", robots: { index: false } };

export default async function NewEvent() {
  if (!(await isHost())) redirect("/host");
  return (
    <main className="mx-auto max-w-lg px-5 pt-4 pb-16">
      <Link href="/host" className="text-[16px] text-soft">‹ Your events</Link>
      <h1 className="mt-4 text-[28px] font-bold">New event</h1>
      <form action={createEvent} className="mt-4 space-y-3">
        <EventFields />
        <SaveButton className="btn w-full">Create event</SaveButton>
      </form>
    </main>
  );
}
