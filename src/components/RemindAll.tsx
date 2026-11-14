"use client";

import { useActionState, useState } from "react";

/** One button to email a reminder to every guest (with an email) who hasn't answered. Asks "Sure?" first. */
export function RemindAll({ count, action }: { count: number; action: (prev: string | null) => Promise<string> }) {
  const [result, send, sending] = useActionState(action, null);
  const [sure, setSure] = useState(false);
  return (
    <div className="mt-3 text-[15px]">
      {result ? (
        <p role="status" className="text-soft">{result}</p>
      ) : sure ? (
        <form action={send} className="flex items-center gap-3">
          <button className="btn px-4 text-[15px]" disabled={sending}>{sending ? "Sending…" : `Email ${count} reminder${count === 1 ? "" : "s"}`}</button>
          <button type="button" className="text-soft underline" onClick={() => setSure(false)}>Cancel</button>
        </form>
      ) : (
        <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setSure(true)}>
          Remind the {count} who {count === 1 ? "hasn't" : "haven't"} replied (by email)
        </button>
      )}
    </div>
  );
}
