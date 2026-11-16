"use client";

import { useEffect, useRef, useState } from "react";
import { placeAddress, placeSuggestions } from "@/app/places";
import type { PlaceSuggestion } from "@/lib/places";

/**
 * Place and Address. With Google search on (`search`), typing a place suggests real ones after a short pause;
 * picking one fills the Address from Google. The Place box keeps the host's own words (Google's listing names
 * can't be stored). Only real typing searches (never a restored draft), at most 12 requests per entry.
 */
export function PlaceFields({ place: p0, address: a0, search }: { place: string | null; address: string | null; search: boolean }) {
  const [place, setPlace] = useState(p0 ?? "");
  const [address, setAddress] = useState(a0 ?? "");
  const [list, setList] = useState<PlaceSuggestion[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const asked = useRef(0);
  const addressBox = useRef<HTMLInputElement>(null);
  const filled = useRef(false);

  useEffect(() => {
    // Let the form's draft keeper see the filled-in address, as if it were typed.
    if (filled.current) { filled.current = false; addressBox.current?.dispatchEvent(new Event("input", { bubbles: true })); }
  }, [address]);

  const typed = (value: string, real: boolean) => {
    setPlace(value);
    setNote(null);
    clearTimeout(timer.current);
    if (!search || !real || value.trim().length < 3) { setList([]); if (!value.trim()) asked.current = 0; return; }
    if (asked.current >= 12) return;
    timer.current = setTimeout(async () => {
      asked.current++;
      const r = await placeSuggestions(value);
      setList(r.ok ? r.value : []);
    }, 350);
  };

  const pick = async (s: PlaceSuggestion) => {
    setList([]);
    setNote("Getting the address…");
    const r = await placeAddress(s.placeId);
    if (r.ok) { filled.current = true; setAddress(r.value); setNote("Address filled in ✓"); }
    else setNote("Couldn't get that address. Type it in below.");
  };

  return (
    <>
      <label className="relative block min-w-0">
        <span className="text-[15px] text-soft">Place</span>
        <input
          name="place" value={place} placeholder="e.g. a home, a park, a restaurant" className="field mt-1" autoComplete="off"
          onChange={(e) => typed(e.target.value, e.nativeEvent.isTrusted)}
          onBlur={() => setTimeout(() => setList([]), 200)}
          onKeyDown={(e) => { if (e.key === "Escape") setList([]); }}
        />
        {list.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-2xl border border-line bg-white" aria-label="Places from Google">
            {list.map((s) => (
              <button
                key={s.placeId} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                className="block min-h-[48px] w-full border-b border-line px-4 py-2 text-left last:border-b-0"
              >
                <span className="block text-[16px] font-semibold">{s.main}</span>
                {s.secondary && <span className="block text-[14px] text-soft">{s.secondary}</span>}
              </button>
            ))}
            <div className="flex justify-end px-4 py-2">
              {/* Google requires its mark wherever its suggestions show without a Google map. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png" alt="Powered by Google" width={144} height={18} />
            </div>
          </div>
        )}
      </label>
      <label className="block min-w-0">
        <span className="text-[15px] text-soft">Address</span>
        <input ref={addressBox} name="address" value={address} onChange={(e) => setAddress(e.target.value)} className="field mt-1" />
        {note && <span role="status" className="mt-1 block text-[14px] text-soft">{note}</span>}
      </label>
    </>
  );
}
