import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="smallcaps text-2xl italic">Not found</h1>
      <p className="mt-4 italic">That link doesn’t seem to go anywhere. Double-check it, or ask Hudson or Molly.</p>
      <Link href="/" className="mt-6 inline-block underline">Home</Link>
    </main>
  );
}
