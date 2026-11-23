import { isHex, themeTokens } from "@/lib/theme";

/** An invite's color (from its cover): pale paper and matching grays on the invite and reply pages. Nothing when plain. */
export function Theme({ color }: { color: string | null }) {
  if (!color || !isHex(color)) return null;
  const t = themeTokens(color);
  // The RSVP button and picked choices take the deep shade; body text stays ink and links stay slate.
  return <style>{`:root{--color-soft:${t.soft};--color-line:${t.line}}body{background:${t.paper}}`
    + `.button{background:${t.accent};color:${t.onAccent}}`
    + `.choice[aria-pressed="true"]{background:${t.accent};border-color:${t.accent};box-shadow:none;color:${t.onAccent}}`}</style>;
}
