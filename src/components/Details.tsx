import { inline, parseDetails, type Line } from "@/lib/details";

/** The event's details: section titles, bullets, **bold** and tappable links. */
export function Details({ text }: { text: string }) {
  return (
    <>
      {parseDetails(text).map((block, i) => (
        <div key={i} className="space-y-1">
          {group(block).map((g, j) =>
            Array.isArray(g) ? (
              <ul key={j} className="space-y-1">
                {g.map((l, k) => (
                  <li key={k} className="flex gap-2"><span aria-hidden className="text-soft">•</span><span><Rich text={l.text} /></span></li>
                ))}
              </ul>
            ) : g.kind === "heading" ? (
              <h3 key={j} className="text-[17px] font-bold">{g.text}</h3>
            ) : (
              <p key={j}><Rich text={g.text} /></p>
            ),
          )}
        </div>
      ))}
    </>
  );
}

/** Runs of bullets become one list. */
function group(lines: Line[]) {
  const out: (Line | Line[])[] = [];
  for (const l of lines) {
    const last = out.at(-1);
    if (l.kind === "bullet" && Array.isArray(last)) last.push(l);
    else out.push(l.kind === "bullet" ? [l] : l);
  }
  return out;
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {inline(text).map((p, i) =>
        p.href ? (
          <a key={i} href={p.href} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">
            {p.text.length > 42 ? `${p.text.slice(0, 40)}…` : p.text}
          </a>
        ) : p.bold ? (
          <strong key={i}>{p.text}</strong>
        ) : (
          p.text
        ),
      )}
    </>
  );
}
