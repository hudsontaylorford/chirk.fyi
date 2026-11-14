import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Privacy · chirk", description: "What chirk keeps, who sees it, and how to remove it." };

/** The privacy page: short, plain, and accurate to what the site actually stores. */
export default function Privacy() {
  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-10 text-[16px] leading-relaxed">
      <Link href="/" className="text-[15px] text-soft">‹ chirk</Link>
      <h1 className="mt-6 text-[28px] leading-tight font-bold">Privacy</h1>
      <p className="mt-3 text-soft">chirk is invite only. Events are reached through links hosts send, and guests never need an account.</p>
      <dl className="mt-6 space-y-4">
        <Item term="What's kept">The event the host writes, and your reply: names, your answer, anything you add, and an email if one&apos;s added.</Item>
        <Item term="Who sees it">Hosts see everything. Anyone with the link sees who&apos;s coming, what they&apos;re bringing, and any notes the host shows. Emails stay with the hosts.</Item>
        <Item term="Email">Only your own link, or an invitation, reminder or note from a host. Never marketing.</Item>
        <Item term="Cookies">One per event, to remember your reply. No ads, analytics or tracking.</Item>
        <Item term="Your data">Stored with Vercel and Neon, and never sold or shared. To remove a reply, ask the host or write to{" "}
          <a href="mailto:hello@chirk.fyi" className="underline underline-offset-2">hello@chirk.fyi</a>.</Item>
      </dl>
      <p className="mt-8 text-[14px] text-soft">Last updated November 15, 2026.</p>
    </main>
    <Footer />
    </>
  );
}

function Item({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}
