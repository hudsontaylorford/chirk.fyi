"use client";

/** A link-like button that opens one row of the event form below and scrolls to it. */
export function OpenRow({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <button
      type="button" className="text-[16px] font-semibold underline underline-offset-2"
      onClick={() => {
        const row = document.getElementById(id) as HTMLDetailsElement | null;
        if (!row) return;
        // Open it and anything it's tucked inside (a row under "More options").
        for (let d: HTMLElement | null = row; d; d = d.parentElement?.closest("details") ?? null) (d as HTMLDetailsElement).open = true;
        row.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </button>
  );
}
