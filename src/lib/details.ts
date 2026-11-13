// The host's details text, with a few explicit marks (no guessing):
//   # Title       a section title
//   - item        a bullet (• and * work too; "a • b" pasted on one line splits into two)
//   **bold**      bold text (handled when rendering)
//   blank line    a new block
// Web addresses become links when rendering.

export type Line = { kind: "heading" | "bullet" | "text"; text: string };

export function parseDetails(text: string): Line[][] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((chunk) =>
      chunk
        .split("\n")
        .flatMap((raw) => raw.split(/\s+•\s+/).map((part, i) => (i > 0 ? `• ${part}` : part)))
        .map((raw): Line => {
          const t = raw.trim();
          if (/^#{1,3}\s+/.test(t)) return { kind: "heading", text: t.replace(/^#{1,3}\s+/, "") };
          if (/^[•\-*]\s+/.test(t)) return { kind: "bullet", text: t.replace(/^[•\-*]\s+/, "") };
          return { kind: "text", text: t };
        })
        .filter((l) => l.text),
    )
    .filter((block) => block.length);
}

/** Splits a line into plain, **bold** and link pieces. */
export function inline(text: string): { bold?: boolean; href?: string; text: string }[] {
  return text
    .split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/)
    .filter(Boolean)
    .map((p) =>
      p.startsWith("**") && p.endsWith("**") && p.length > 4 ? { bold: true, text: p.slice(2, -2) }
      : /^https?:\/\//.test(p) ? { href: p, text: p.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") }
      : { text: p },
    );
}

/**
 * "Auto-format": turns a pasted group text into the explicit marks above, so the host can see and edit them.
 * - pasted bullets (•, *, "a • b" on one line) become "- " lines
 * - a block's short first line (≤ 40 chars, no colon or ending punctuation) with more lines under it becomes "# Title"
 * - a line starting "Label: " becomes "**Label:** "
 * Running it twice changes nothing.
 */
export function autoFormat(text: string): string {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((chunk) => {
      const lines = chunk
        .split("\n")
        .flatMap((raw) => raw.split(/\s+•\s+/).map((part, i) => (i > 0 ? `- ${part.trim()}` : part.trimEnd())))
        .map((l) => l.replace(/^\s*[•*]\s+/, "- "))
        .filter((l) => l.trim());
      const first = lines[0]?.trim() ?? "";
      const isTitle = lines.length > 1 && first.length <= 40 && !/^(#|- )/.test(first) && !first.includes(":") && !/[.!?,]$/.test(first);
      return lines
        .map((l, i) => (i === 0 && isTitle ? `# ${first}` : l))
        .map((l) => l.replace(/^(- )?([A-Z][\w &'/]{0,24}):\s+/, (_m, dash = "", label) => `${dash}**${label}:** `))
        .join("\n");
    })
    .join("\n\n");
}
