"use client";

import { useState } from "react";

export function EditToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="mt-8 border-t border-line pt-6">{children}</div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="btn btn-quiet mt-3 w-full">
      Change my reply
    </button>
  );
}
