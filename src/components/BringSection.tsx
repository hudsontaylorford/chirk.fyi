"use client";

import { useState } from "react";

/**
 * The bring list, switched on or off. Its settings stay in the form while it's off (just hidden),
 * so turning it off and on again doesn't lose them.
 */
export function BringSection({
  prompt, allowOwn, allowDoubles, newEvent,
}: { prompt: string | null; allowOwn: boolean; allowDoubles: boolean; newEvent: boolean }) {
  const [on, setOn] = useState(!!prompt);
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3">
      <label className="flex items-center justify-between gap-3 text-[16px] font-semibold">
        Ask guests to bring things
        <input type="checkbox" name="bring_on" checked={on} onChange={(e) => setOn(e.target.checked)} className="h-5 w-5 shrink-0" />
      </label>
      <div hidden={!on} className="mt-3 space-y-3">
        {newEvent ? (
          <label className="block">
            <span className="text-[15px] text-soft">Things needed, separated by commas</span>
            <textarea name="needed" rows={2} className="field mt-1" placeholder="Glue, paper, scissors" />
          </label>
        ) : (
          <p className="text-[15px] text-soft">Edit the list itself under &ldquo;Needed list&rdquo; on this page.</p>
        )}
        <label className="block">
          <span className="text-[15px] text-soft">The question guests see</span>
          <input name="bring_prompt" defaultValue={prompt ?? ""} placeholder="What are you bringing?" className="field mt-1" />
        </label>
        <Toggle name="allow_own" checked={allowOwn} label="Guests can add their own things" />
        <Toggle name="allow_doubles" checked={allowDoubles} label="Let people bring the same thing" />
      </div>
    </div>
  );
}

function Toggle({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="flex items-center gap-3 py-1 text-[16px]">
      <input type="checkbox" name={name} defaultChecked={checked} className="h-5 w-5 shrink-0" />
      {label}
    </label>
  );
}
