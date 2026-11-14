"use client";

import { useState } from "react";
import { autoFormat, clearFormatting } from "@/lib/details";
import { Details } from "./Details";

/** The details box: the formatting marks right under it, three small tools, and a preview on request. */
export function DetailsInput({ value }: { value: string }) {
  const [text, setText] = useState(value);
  const [preview, setPreview] = useState(false);
  const empty = !text.trim();
  return (
    <div>
      <label className="block">
        <span className="sr-only">Message</span>
        <textarea name="details" rows={8} value={text} onChange={(e) => setText(e.target.value)} className="field mt-1" />
      </label>
      <p className="mt-1 text-[13px] text-soft">
        <code># Title</code> · <code>- bullet</code> · <code>**bold**</code> · blank line = new paragraph · links work on their own
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="pill px-3 py-1.5 text-[14px]" disabled={empty} onClick={() => setText(autoFormat(text))}>Auto-format</button>
        <button type="button" className="pill px-3 py-1.5 text-[14px]" disabled={empty} onClick={() => setText(clearFormatting(text))}>Clear formatting</button>
        <button type="button" className="pill px-3 py-1.5 text-[14px]" disabled={empty} aria-pressed={preview} onClick={() => setPreview(!preview)}>Preview</button>
      </div>
      {preview && !empty && (
        <div className="mt-3 space-y-3 rounded-2xl border border-line bg-white p-4 text-[16px] leading-relaxed">
          <Details text={text} />
        </div>
      )}
    </div>
  );
}
