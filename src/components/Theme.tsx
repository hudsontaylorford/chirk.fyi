import { isHex, themeTokens } from "@/lib/theme";

/** An invite's color (from its cover): pale paper and matching grays on the invite and reply pages. Nothing when plain. */
export function Theme({ color }: { color: string | null }) {
  if (!color || !isHex(color)) return null;
  const t = themeTokens(color);
  return <style>{`:root{--color-soft:${t.soft};--color-line:${t.line}}body{background:${t.paper}}`}</style>;
}
