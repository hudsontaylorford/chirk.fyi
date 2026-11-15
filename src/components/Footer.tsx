import Link from "next/link";

/**
 * One quiet line for people who belong here: anyone who reached a page through a link, and signed-in hosts.
 * Pages include it themselves; strangers on the home page and bad links never see it.
 * The bottom space keeps it clear of the pinned RSVP button.
 */
export function Footer() {
  return (
    <footer className="mx-auto max-w-lg px-5 pt-12 pb-28 text-center text-[13px] text-soft">
      chirk* · By invitation only · <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>
      {" · "}<Link href="/terms" className="underline underline-offset-2">Terms</Link>
    </footer>
  );
}
