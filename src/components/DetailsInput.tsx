"use client";

import { useState } from "react";
import { Details } from "./Details";

/** The details box, with the few formatting marks spelled out and a live preview of what guests see. */
export function DetailsInput({ value }: { value: string }) {
  const [text, setText] = useState(value);
  return (
    <div>
      <label className="block">
        <span className="text-[15px] text-soft">Details</span>
        <textarea name="details" rows={8} value={text} onChange={(e) => setText(e.target.value)} className="field mt-1" />
      </label>
      <p className="mt-1 text-[14px] text-soft">
        <code># Title</code> for a section · <code>- item</code> for a bullet · <code>**bold**</code> · blank line = new paragraph · links work on their own
      </p>
      {text.trim() && (
        <div className="mt-3 rounded-2xl border border-line bg-white p-4">
          <p className="mb-2 text-[13px] font-semibold tracking-wide text-soft uppercase">Preview</p>
          <div className="space-y-3 text-[16px] leading-relaxed"><Details text={text} /></div>
        </div>
      )}
    </div>
  );
}
