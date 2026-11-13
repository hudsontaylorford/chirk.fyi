import { parseDetails } from "@/lib/details";

/** The event's details, with headings, bullets, bold "Label:" starts and tappable links. */
export function Details({ text }: { text: string }) {
  return (
    <>
      {parseDetails(text).map((b, i) => (
        <div key={i}>
          {b.heading && <h3 className="mb-1 text-[17px] font-bold">{b.heading}</h3>}
          {b.lines.some((l) => l.bullet) ? (
            <ul className="space-y-1">
              {b.lines.map((l, j) =>
                l.bullet ? (
                  <li key={j} className="flex gap-2"><span aria-hidden className="text-soft">•</span><span><Rich text={l.text} /></span></li>
                ) : (
                  <li key={j}><Rich text={l.text} /></li>
                ),
              )}
            </ul>
          ) : (
            b.lines.map((l, j) => <p key={j}><Rich text={l.text} /></p>)
          )}
        </div>
      ))}
    </>
  );
}

/** Bold a leading "Label:" and turn web addresses into links. */
function Rich({ text }: { text: string }) {
  const label = text.match(/^([A-Z][\w &'/]{0,24}):\s/);
  const rest = label ? text.slice(label[0].length) : text;
  return (
    <>
      {label && <strong>{label[1]}: </strong>}
      {rest.split(/(https?:\/\/\S+)/).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} className="break-all underline underline-offset-2" target="_blank" rel="noreferrer">
            {part.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 40)}
            {part.length > 48 ? "…" : ""}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
