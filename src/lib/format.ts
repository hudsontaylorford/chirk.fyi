// Dates are stored as plain YYYY-MM-DD and times as HH:MM, already in New York time.

const fmt = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

export const longDate = (d: string) => fmt(d, { weekday: "long", month: "long", day: "numeric" });
export const shortDate = (d: string) => fmt(d, { weekday: "short", month: "short", day: "numeric" });

export function clock(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}

export function mapsUrl(address: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}
