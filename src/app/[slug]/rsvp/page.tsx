import Link from "next/link";
import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/RsvpForm";
import { getBoard } from "@/lib/data";
import { formProps } from "@/lib/form-props";

export const dynamic = "force-dynamic";
export const metadata = { title: "RSVP" };

export default async function RsvpPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { slug } = await params;
  const { slot } = await searchParams;
  const board = await getBoard(slug);
  if (!board) notFound();

  return (
    <main className="mx-auto max-w-xl px-3 pt-6 pb-16 sm:px-0">
      <Link href={`/${slug}/details`} className="px-2 text-[16px] italic opacity-90">← {board.event.title}</Link>
      <div className="paper mt-4 px-5 py-6 sm:px-8">
        <h1 className="smallcaps text-center text-2xl text-maroon">RSVP</h1>
        <p className="mt-1 mb-6 text-center text-[16px] italic text-muted">Takes about a minute.</p>
        <RsvpForm {...formProps(board)} preselectSlot={slot} />
      </div>
    </main>
  );
}
