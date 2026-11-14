"use client";

import { useEffect, useRef, useState } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Keeps a copy of the surrounding form on this phone while the host types, and brings it back
 * after a reload or a closed tab. Cleared when the form is saved.
 * shortcut: the cover photo (a hidden field) isn't kept; uploads are saved right away, so only an unsaved link is lost.
 */
export function FormDraft({ id }: { id: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const dirty = useRef(false);
  const off = useRef(false); // set by Discard, so its own click isn't saved as a change
  const [restored, setRestored] = useState(false);
  const key = `chirk-draft:${id}`;

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const fields = () => [...form.elements].filter((el): el is Field => "name" in el && !!(el as Field).name && !["hidden", "file", "submit"].includes((el as Field).type));
    const snapshot = () => JSON.stringify(Object.fromEntries(fields().map((el) => [el.name, el instanceof HTMLInputElement && el.type === "checkbox" ? el.checked : el.value])));
    const start = snapshot();

    let saved: string | null = null;
    try { saved = localStorage.getItem(key); } catch {}
    if (saved && saved !== start) {
      const data = JSON.parse(saved) as Record<string, string | boolean>;
      for (const el of fields()) {
        if (!(el.name in data)) continue;
        const v = data[el.name];
        if (el instanceof HTMLInputElement && el.type === "checkbox") { if (el.checked !== v) el.click(); continue; }
        if (el.value === v) continue;
        // Set it the way typing would, so fields React manages pick it up too.
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set?.call(el, String(v));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      form.closest("details")?.setAttribute("open", "");
      dirty.current = true;
      setRestored(true);
    }

    const keep = () => setTimeout(() => {
      if (off.current) return;
      const now = snapshot();
      dirty.current = now !== start;
      try { if (dirty.current) localStorage.setItem(key, now); else localStorage.removeItem(key); } catch {}
    });
    // shortcut: cleared when Save is pressed, before the server answers; if saving fails the page still shows the text.
    const done = () => { dirty.current = false; try { localStorage.removeItem(key); } catch {} };
    const leaving = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault(); };
    form.addEventListener("input", keep);
    // Auto-format and other buttons change text without typing; Save itself doesn't count.
    const clicked = (e: MouseEvent) => { if ((e.target as Element).closest("button")?.type === "button") keep(); };
    form.addEventListener("click", clicked);
    form.addEventListener("submit", done);
    window.addEventListener("beforeunload", leaving);
    return () => {
      form.removeEventListener("input", keep);
      form.removeEventListener("click", clicked);
      form.removeEventListener("submit", done);
      window.removeEventListener("beforeunload", leaving);
    };
  }, [key]);

  function discard() {
    off.current = true;
    dirty.current = false;
    try { localStorage.removeItem(key); } catch {}
    location.reload();
  }

  return (
    <span ref={ref} className="block">
      {restored && (
        <span role="status" className="block rounded-2xl bg-amber-50 p-3 text-[15px] text-amber-900">
          Restored what you were typing.{" "}
          <button type="button" className="font-semibold underline underline-offset-2" onClick={discard}>Discard</button>
        </span>
      )}
    </span>
  );
}
