// Turns the host's plain-text details into simple blocks: a heading, plain lines, and bullets.
// Rules (so a pasted group text just works):
// - A blank line starts a new block.
// - Lines starting with •, - or * are bullets ("a • b" on one line splits into two bullets).
// - A block's short first line (≤ 40 chars, no colon or ending punctuation) followed by more lines is its heading.

export type Line = { bullet: boolean; text: string };
export type Block = { heading?: string; lines: Line[] };

export function parseDetails(text: string): Block[] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((chunk) => {
      const lines: Line[] = chunk
        .split("\n")
        .flatMap((raw) => {
          const parts = raw.split(/\s+[•]\s+/); // "…year	•	If driving…" → two bullets
          return parts.map((p, i) => ({ raw: p, bullet: i > 0 || /^\s*[•\-*]\s+/.test(p) }));
        })
        .map(({ raw, bullet }) => ({ bullet, text: raw.replace(/^\s*[•\-*]\s+/, "").trim() }))
        .filter((l) => l.text);
      const first = lines[0];
      if (lines.length > 1 && first && !first.bullet && first.text.length <= 40 && !/[.!?,]$/.test(first.text) && !first.text.includes(":")) {
        return { heading: first.text, lines: lines.slice(1) };
      }
      return { lines };
    })
    .filter((b) => b.heading || b.lines.length);
}
