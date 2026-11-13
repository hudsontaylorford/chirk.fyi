"use client";

import { useTransition } from "react";

/** A small button that asks "are you sure?" before running a server action. */
export function ConfirmButton({
  action, confirm, children, className,
}: {
  action: () => Promise<void>;
  confirm: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className ?? "text-[14px] text-alert underline disabled:opacity-50"}
      onClick={() => window.confirm(confirm) && start(() => action())}
    >
      {pending ? "…" : children}
    </button>
  );
}
