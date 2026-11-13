import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/CopyLink";
import { RsvpForm } from "@/components/RsvpForm";
import { getBoard, getGuestByToken } from "@/lib/data";
import { formProps, initialFor } from "@/lib/form-props";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your RSVP", robots: { index: false } };

export default async function MyRsvp({
  params, searchParams,
}: {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug, token } = await params;
  const { saved } = await searchParams;
  const guest = await getGuestByToken(token);
  if (!guest || guest.slug !== slug) notFound();
  const board = (await getBoard(slug))!;
  const path = `/${slug}/me/${token}`;

  return (
    <main className="mx-auto max-w-xl px-3 pt-6 pb-16 sm:px-0">
      <Link href={`/${slug}`} className="px-2 text-[16px] italic opacity-90">← {board.event.title}</Link>

      <section className="paper mt-4 px-5 py-6 sm:px-8">
        {saved ? (
          <>
            <h1 className="smallcaps text-center text-2xl text-maroon">
              {guest.status === "no" ? "Thanks for letting us know" : "You’re on the list!"}
            </h1>
            <p className="mt-2 text-center text-[17px] italic">
              {guest.status === "no" ? "We’ll miss you." : "Thank you. We can’t wait to see you."}
            </p>
          </>
        ) : (
          <h1 className="smallcaps text-center text-2xl text-maroon">Your RSVP</h1>
        )}
        <div className="mt-5 rounded-md border-2 border-dashed border-gold bg-[#fff7e3] p-4">
          <p className="text-[17px] font-semibold">Save this link to make changes later</p>
          <p className="mb-3 text-[15px] italic text-muted">
            It’s your personal link. Use it to change your RSVP or name your dish. Bookmark it, or text it to yourself.
          </p>
          <CopyLink path={path} title={board.event.title} />
        </div>
      </section>

      <section className="paper mt-4 px-5 py-6 sm:px-8">
        <h2 className="smallcaps mb-5 text-lg text-maroon">Make changes</h2>
        <RsvpForm {...formProps(board, guest.id)} initial={initialFor(board, guest.id)} />
      </section>
    </main>
  );
}
