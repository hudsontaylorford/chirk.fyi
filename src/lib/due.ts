// Which scheduled jobs are due for an event on a given day. Pure; dates are YYYY-MM-DD (New York).

export type Job = "gift_draw" | "gift_ideas" | "gift_givers" | "reply_reminder";

export type Schedule = {
  status: string;
  date: string; // the event
  rsvp_by: string | null;
  remind_replies: boolean;
  gift_on: boolean;
  gift_draw_on: string | null;
  gift_remind_ideas: boolean;
  gift_remind_givers: boolean;
};

/** "2026-11-26" minus 3 days → "2026-11-23". */
export const daysBefore = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

/** The "you're giving to…" reminder: a week before the event, but never before the day after names are drawn. */
export const giversFrom = (date: string, drawOn: string) => {
  const week = daysBefore(date, 7), after = daysBefore(drawOn, -1);
  return week > after ? week : after;
};

/**
 * Each job runs once (`sent` holds the ones already done), from its day onward until its window closes,
 * so a missed morning catches up the next day instead of skipping. Only live events send anything.
 */
export function dueJobs(e: Schedule, today: string, sent: Set<Job>): Job[] {
  if (e.status !== "live") return [];
  const due: Job[] = [];
  const open = (job: Job, from: string, until: string) => !sent.has(job) && today >= from && today <= until && due.push(job);
  if (e.gift_on && e.gift_draw_on) {
    if (e.gift_remind_ideas) open("gift_ideas", daysBefore(e.gift_draw_on, 3), daysBefore(e.gift_draw_on, 1));
    open("gift_draw", e.gift_draw_on, e.date);
    if (e.gift_remind_givers && sent.has("gift_draw")) open("gift_givers", giversFrom(e.date, e.gift_draw_on), daysBefore(e.date, 1));
  }
  if (e.remind_replies && e.rsvp_by) open("reply_reminder", daysBefore(e.rsvp_by, 3), e.rsvp_by);
  return due;
}
