"use client";

import { useEffect, useRef, useState } from "react";
import { placeAddress, placeSuggestions } from "@/app/places";
import type { PlaceSuggestion } from "@/lib/places";

type Box = "place" | "address";

/**
 * Place and Address. With Google search on (`search`), typing in either box suggests real places after a short pause;
 * picking one fills the Address from Google. The Place box keeps the host's own words (Google's listing names
 * can't be stored). Only real typing searches (never a restored draft), at most 12 requests per entry.
 * Both boxes are marked as comboboxes with their own list, which also keeps the phone's contact AutoFill out of the way.
 */
export function PlaceFields({ place: p0, address: a0, search }: { place: string | null; address: string | null; search: boolean }) {
  const [value, setValue] = useState<Record<Box, string>>({ place: p0 ?? "", address: a0 ?? "" });
  const [open, setOpen] = useState<{ box: Box; list: PlaceSuggestion[] } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const asked = useRef<Record<Box, number>>({ place: 0, address: 0 });
  const addressBox = useRef<HTMLInputElement>(null);
  const filled = useRef(false);

  useEffect(() => {
    // Let the form's draft keeper see the filled-in address, as if it were typed.
    if (filled.current) { filled.current = false; addressBox.current?.dispatchEvent(new Event("input", { bubbles: true })); }
  }, [value.address]);

  const typed = (box: Box, text: string, real: boolean) => {
    setValue((v) => ({ ...v, [box]: text }));
    setNote(null);
    clearTimeout(timer.current);
    if (!text.trim()) asked.current[box] = 0;
    if (!search || !real || text.trim().length < 3) { setOpen(null); return; }
    if (asked.current[box] >= 12) return;
    timer.current = setTimeout(async () => {
      asked.current[box]++;
      const r = await placeSuggestions(text);
      setOpen(r.ok && r.value.length ? { box, list: r.value } : null);
    }, 350);
  };

  const pick = async (s: PlaceSuggestion) => {
    setOpen(null);
    setNote("Getting the address…");
    const r = await placeAddress(s.placeId);
    if (r.ok) { filled.current = true; setValue((v) => ({ ...v, address: r.value })); setNote("Address filled in ✓"); }
    else setNote("Couldn't get that address. Type it in.");
  };

  const field = (box: Box, label: string, placeholder?: string) => {
    const list = open?.box === box ? open.list : [];
    return (
      <label className="block min-w-0">
        <span className="text-[15px] text-soft">{label}</span>
        <input
          ref={box === "address" ? addressBox : undefined} name={box} value={value[box]} placeholder={placeholder} className="field mt-1"
          autoComplete="off" role={search ? "combobox" : undefined} aria-autocomplete={search ? "list" : undefined}
          aria-expanded={search ? list.length > 0 : undefined} aria-controls={search ? `${box}-places` : undefined}
          onChange={(e) => typed(box, e.target.value, e.nativeEvent.isTrusted)}
          onBlur={() => setTimeout(() => setOpen((o) => (o?.box === box ? null : o)), 200)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(null); }}
        />
        {list.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-2xl border border-line bg-white">
            <ul id={`${box}-places`} role="listbox" aria-label="Places from Google">
              {list.map((s) => (
                <li key={s.placeId} role="option" aria-selected={false}>
                  <button
                    type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                    className="block min-h-[48px] w-full border-b border-line px-4 py-2 text-left"
                  >
                    <span className="block text-[16px] font-semibold">{s.main}</span>
                    {s.secondary && <span className="block text-[14px] text-soft">{s.secondary}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end px-4 py-2">
              {/* Google requires its mark wherever its suggestions show without a Google map. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" width={144} height={18} />
            </div>
          </div>
        )}
        {box === "address" && note && <span role="status" className="mt-1 block text-[14px] text-soft">{note}</span>}
      </label>
    );
  };

  return (
    <>
      {field("place", "Place", "e.g. a home, a park, a restaurant")}
      {field("address", "Address")}
    </>
  );
}
