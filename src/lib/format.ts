// Date/time helpers. Dates are stored as plain YYYY-MM-DD and times as HH:MM(:SS),
// already in the event's local time, so we never convert time zones.

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function parts(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return { y, m, day, dow };
}

export function longDate(d: string) {
  const p = parts(d);
  return `${DAYS[p.dow]}, ${MONTHS[p.m - 1]} ${p.day}, ${p.y}`;
}

export function shortDate(d: string) {
  const p = parts(d);
  return `${DAYS[p.dow]}, ${MONTHS[p.m - 1].slice(0, 3)} ${p.day}`;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function deadlineText(d: string) {
  const p = parts(d);
  return `${DAYS[p.dow]}, the ${ordinal(p.day)}`;
}

export function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function clock(mins: number) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const WORDS = ["twelve","one","two","three","four","five","six","seven","eight","nine","ten","eleven"];
export function elegantTime(t: string) {
  const mins = toMinutes(t);
  const h = Math.floor(mins / 60), m = mins % 60;
  const hw = WORDS[h % 12];
  const part = h < 12 ? "in the morning" : h < 17 ? "in the afternoon" : "in the evening";
  if (m === 0) return `${hw} o’clock ${part}`;
  if (m === 30) return `half past ${hw} ${part}`;
  if (m === 15) return `quarter past ${hw} ${part}`;
  return `${clock(mins)}`;
}

/** True once the given YYYY-MM-DD has fully passed in New York. */
export function isPast(d: string | null, tz = "America/New_York") {
  if (!d) return false;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  return today > d;
}
