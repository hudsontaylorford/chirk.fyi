"use client";

import { useState } from "react";

export interface ListItem { name: string; by: string | null } // by = who's bringing it, if anyone

/**
 * "What to bring": on or off, the list itself, and how guests can use it. The same on New event and Edit event.
 * The list lives in a (hidden) text box, one thing per line, so it saves with the rest of the form.
 * While it's off, everything stays in the form (just hidden), so turning it back on loses nothing.
 */
export function BringFields({
  prompt, allowOwn, allowDoubles, items,
}: { prompt: string | null; allowOwn: boolean; allowDoubles: boolean; items: ListItem[] }) {
  const [on, setOn] = useState(!!prompt);
  const [text, setText] = useState(items.map((i) => i.name).join("\n"));
  const [typing, setTyping] = useState("");
  const names = text.split("\n").filter(Boolean);
  const by = new Map(items.map((i) => [i.name.toLowerCase(), i.by]));

  function add() {
    const fresh = typing.split(",").map((t) => t.trim()).filter((t) => t && !names.some((n) => n.toLowerCase() === t.toLowerCase()));
    if (fresh.length) setText([...names, ...fresh].join("\n"));
    setTyping("");
  }
  function remove(name: string) {
    const who = by.get(name.toLowerCase());
    if (who && !window.confirm(`${who} ${who.includes("&") || who.includes(",") ? "are" : "is"} bringing ${name}. Take it off the list anyway?`)) return;
    setText(names.filter((n) => n !== name).join("\n"));
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-3 text-[16px] font-semibold">
        Ask guests to bring things
        <input type="checkbox" name="bring_on" checked={on} onChange={(e) => setOn(e.target.checked)} className="h-5 w-5 shrink-0" />
      </label>
      <div hidden={!on} className="space-y-3">
        <textarea name="needed" value={text} onChange={(e) => setText(e.target.value)} hidden aria-hidden />
        {names.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {names.map((n) => (
              <button key={n} type="button" className="pill px-3 py-1 text-[15px]" onClick={() => remove(n)} aria-label={`Remove ${n}`}>
                {n}
                {by.get(n.toLowerCase()) && <span className="text-soft"> · {by.get(n.toLowerCase())}</span>}
                <span aria-hidden className="ml-1.5 text-soft">✕</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="field" value={typing} placeholder="Add things (commas for several)" aria-label="Add things"
            onChange={(e) => setTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          />
          <button type="button" className="btn btn-quiet shrink-0 px-4" disabled={!typing.trim()} onClick={add}>Add</button>
        </div>
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
