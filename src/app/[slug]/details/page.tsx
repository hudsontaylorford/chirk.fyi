import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteDetails } from "@/components/Invite";
import { MenuBoard } from "@/components/MenuBoard";
import { getBoard } from "@/lib/data";
import { isPast } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const board = await getBoard(slug);
  return board ? { title: `${board.event.title}: details` } : {};
}

export default async function EventDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const board = await getBoard(slug);
  if (!board) notFound();
  const closed = isPast(board.event.event_date);

  return (
    <main className="mx-auto max-w-xl pb-16">
      <Link href={`/${slug}`} className="block px-5 pt-5 text-[16px] italic opacity-90">← Invitation</Link>
      <InviteDetails event={board.event} />

      {!closed && (
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-maroon via-maroon to-transparent px-5 pt-6 pb-4">
          <Link href={`/${slug}/rsvp`} className="btn btn-cream w-full py-4 text-[16px]">
            RSVP &amp; add what you’re bringing
          </Link>
          <p className="mt-2 text-center text-[14px] italic opacity-80">
            Already replied? Open the personal link you saved to make changes.
          </p>
        </div>
      )}

      <div className="mt-4 px-3 sm:px-0">
        <MenuBoard board={board} claimable={!closed} />
      </div>

      {board.event.closing_note && <p className="mt-8 px-5 text-center text-[18px] italic">{board.event.closing_note}</p>}
    </main>
  );
}
