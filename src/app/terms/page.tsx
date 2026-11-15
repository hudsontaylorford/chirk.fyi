import Link from "next/link";
import { Footer } from "@/components/Footer";

export const metadata = { title: "Terms · chirk", description: "The few rules for using chirk." };

/** The terms: short and plain, in the same shape as the privacy page. */
export default function Terms() {
  return (
    <>
    <main className="mx-auto max-w-lg px-5 pt-10 text-[16px] leading-relaxed">
      <Link href="/" className="text-[15px] text-soft">‹ chirk</Link>
      <h1 className="mt-6 text-[28px] leading-tight font-bold">Terms</h1>
      <p className="mt-3 text-soft">chirk is a small, invite-only site for planning get-togethers. By hosting or replying, you agree to these terms.</p>
      <dl className="mt-6 space-y-4">
        <Item term="Use it kindly">Invite people you know. No spam, harassment or anything unlawful, and only share what&apos;s yours to share.</Item>
        <Item term="Your content">What you write stays yours. You let chirk store it and show it to the people it&apos;s shared with.</Item>
        <Item term="Accounts">Hosts sign in with their email, so keep that email secure. Accounts or events that break these terms may be removed.</Item>
        <Item term="As is">chirk is offered as is, without guarantees, and may change or stop. The events themselves are up to their hosts.</Item>
        <Item term="Age">You need to be at least 13 to use chirk.</Item>
        <Item term="Your data">See <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>. To delete your account or a reply, write to{" "}
          <a href="mailto:hello@chirk.fyi" className="underline underline-offset-2">hello@chirk.fyi</a>.</Item>
        <Item term="Changes">If these change, the date below changes and hosts are asked to agree again.</Item>
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
