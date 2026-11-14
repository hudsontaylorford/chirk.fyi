import Link from "next/link";

export const metadata = { title: "Privacy · chirk", description: "What chirk keeps, who sees it, and how to remove it." };

/** The privacy page: short, plain, and accurate to what the site actually stores. */
export default function Privacy() {
  return (
    <main className="mx-auto max-w-lg px-5 pt-10 text-[16px] leading-relaxed">
      <Link href="/" className="text-[15px] text-soft">‹ chirk</Link>
      <h1 className="mt-6 text-[28px] leading-tight font-bold">Privacy</h1>
      <p className="mt-3 text-soft">
        chirk is a small, invite-only site for sharing plans with friends. Events are reached only through links that hosts send,
        and guests never need an account. This page explains what chirk keeps and why.
      </p>

      <Section title="What chirk keeps">
        For each event, what the host writes: the details, the photo, the list. For each reply: names, whether you&apos;re coming,
        and anything you add (kids, parts of the day, what you&apos;re bringing, a note). An email address is kept only if you add one,
        or the host adds it for you.
      </Section>
      <Section title="Who sees it">
        The hosts see every reply. Anyone with the event&apos;s link can see who&apos;s coming and what they&apos;re bringing, and notes
        when the host chooses to show them. Email addresses are only seen by the hosts.
      </Section>
      <Section title="Email">
        chirk emails you only when you ask for your link, or when a host sends you an invitation, a reminder or a note.
        There are no newsletters and no marketing. Email is delivered by Resend, and replies go to the hosts.
      </Section>
      <Section title="Cookies">
        One small cookie per event remembers your reply on that device, so there&apos;s no password to keep. Hosts have a sign-in cookie.
        There are no ads, no analytics and no tracking across sites.
      </Section>
      <Section title="Where it lives">
        The site, its photos and its database are hosted by Vercel and Neon. Your information is never sold or shared with anyone else.
      </Section>
      <Section title="Removing your reply">
        Ask the host, or write to <a href="mailto:hello@chirk.fyi" className="underline underline-offset-2">hello@chirk.fyi</a> and it will be deleted.
        Hosts can delete an event, with every reply on it, at any time.
      </Section>

      <p className="mt-10 text-[14px] text-soft">Last updated November 15, 2026.</p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="mt-1">{children}</p>
    </section>
  );
}
