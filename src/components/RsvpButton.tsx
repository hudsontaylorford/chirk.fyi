"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The RSVP button sits in the page under the date and place, so it never covers the invite.
 * Once it's scrolled up out of view, a copy pins to the bottom of the screen.
 */
export function RsvpButton({ href, label, quiet }: { href: string; label: string; quiet: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const check = () => setPinned(!!ref.current && ref.current.getBoundingClientRect().bottom < 0); // no ref when it's the quiet link
    check();
    addEventListener("scroll", check, { passive: true });
    return () => removeEventListener("scroll", check);
  }, []);
  // Already replied: no second big button, just the way back to their reply.
  if (quiet) return <a href={href} className="link tap text-[17px] font-semibold">{label} ›</a>;
  const cls = "button w-full";
  return (
    <>
      <a ref={ref} href={href} className={cls}>{label}</a>
      {pinned && (
        <div className="fixed inset-x-0 bottom-0 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <a href={href} className={`${cls} mx-auto max-w-lg`}>{label}</a>
        </div>
      )}
    </>
  );
}
