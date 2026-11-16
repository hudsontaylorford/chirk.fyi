// Sends that run on their own (the morning job in src/app/api/cron) and the same sends when a host taps a button.
import { getEvent, joinNames } from "./data";
import { sql } from "./db";
import { daysBefore, dueJobs, type Job } from "./due";
import { sendEmail } from "./email";
import { longDate, shortDate } from "./format";
import { giftEmail, giftGiverEmail, giftIdeasEmail } from "./gift-email";
import { drawNames } from "./gifts";
import { reminderEmail } from "./invite-email";

type GiftEvent = { id: string; slug: string; title: string; date: string; gift_budget: string | null; gift_never: [string, string][]; gift_draw_on: string | null };

const personal = (base: string, slug: string, token: string) => `${base}/${slug}/r/${token}/remember?to=invite`;

/** Guests' replies to chirk's emails go to the event's owner. */
export async function ownerEmail(eventId: string) {
  const [o] = await sql<{ email: string }[]>`select u.email from event_hosts h join users u on u.id = h.user_id where h.event_id = ${eventId} and h.role = 'owner'`;
  return o?.email ?? null;
}

/** Draws names for everyone in, following the rules; replaces any earlier draw. */
export async function drawFor(e: Pick<GiftEvent, "id" | "gift_never">): Promise<{ count: number } | { error: string }> {
  const people = (await sql<{ id: string }[]>`
    select id from households where event_id = ${e.id} and going is not false and gift_in`).map((r) => r.id);
  if (people.length < 2) return { error: "You need at least 2 people in." };
  const draw = drawNames(people, e.gift_never);
  if (!draw) return { error: "No draw works with these rules. Remove a rule, or add someone." };
  await sql.begin(async (tx) => {
    await tx`delete from gift_draws where event_id = ${e.id}`;
    await tx`insert into gift_draws ${tx([...draw].map(([giver, receiver]) => ({ event_id: e.id, giver, receiver })))}`;
  });
  return { count: people.length };
}

type Match = { token: string; giver_id: string; giver: string[]; email: string | null; receiver: string[]; wish: string | null };
const matches = (eventId: string) => sql<Match[]>`
  select g.token, g.id as giver_id, g.names as giver, g.email, r.names as receiver, r.gift_wish as wish
  from gift_draws d join households g on g.id = d.giver join households r on r.id = d.receiver where d.event_id = ${eventId}`;

/** Emails each giver (with an email) their match. The same match only ever goes once. */
export async function emailMatchesFor(e: GiftEvent, base: string) {
  const rows = await matches(e.id);
  const replyTo = await ownerEmail(e.id);
  let sent = 0;
  for (const r of rows.filter((r) => r.email)) {
    const mail = giftEmail({ title: e.title, giver: joinNames(r.giver), receiver: joinNames(r.receiver), budget: e.gift_budget, wish: r.wish, url: personal(base, e.slug, r.token) });
    if (await sendEmail({ to: r.email!, ...mail, replyTo, idempotencyKey: `gift-${r.giver_id}-${joinNames(r.receiver)}` })) sent++;
  }
  return { sent, total: rows.length, none: rows.filter((r) => !r.email).length };
}

/** 3 days before the draw: everyone in who hasn't added ideas (or replied yet) gets a nudge. */
async function remindIdeas(e: GiftEvent, base: string) {
  const rows = await sql<{ token: string; names: string[]; email: string }[]>`
    select token, names, email from households where event_id = ${e.id} and going is not false and gift_in
      and email is not null and (gift_wish is null or going is null)`;
  const replyTo = await ownerEmail(e.id);
  for (const h of rows) {
    const mail = giftIdeasEmail({ title: e.title, names: joinNames(h.names), drawOn: shortDate(e.gift_draw_on!), url: personal(base, e.slug, h.token) });
    await sendEmail({ to: h.email, ...mail, replyTo, idempotencyKey: `gift-ideas-${h.token}` });
  }
  return rows.length;
}

/** A week before the event: each giver is reminded who they're giving to. */
async function remindGivers(e: GiftEvent, base: string) {
  const rows = (await matches(e.id)).filter((r) => r.email);
  const replyTo = await ownerEmail(e.id);
  for (const r of rows) {
    const mail = giftGiverEmail({
      title: e.title, giver: joinNames(r.giver), receiver: joinNames(r.receiver), budget: e.gift_budget, wish: r.wish,
      when: longDate(e.date), url: personal(base, e.slug, r.token),
    });
    await sendEmail({ to: r.email!, ...mail, replyTo, idempotencyKey: `gift-givers-${r.giver_id}-${e.date}` });
  }
  return rows.length;
}

/** 3 days before reply-by: anyone named who hasn't answered gets "Can you make it?". */
async function remindReplies(e: GiftEvent, base: string) {
  const ev = await getEvent(e.slug, true);
  if (!ev) return 0;
  const rows = await sql<{ token: string; names: string[]; email: string }[]>`
    select token, names, email from households where event_id = ${e.id} and going is null and email is not null`;
  const replyTo = await ownerEmail(e.id);
  for (const h of rows) {
    const mail = reminderEmail(ev, personal(base, e.slug, h.token), joinNames(h.names));
    await sendEmail({ to: h.email, ...mail, replyTo, idempotencyKey: `reply-reminder-${h.token}-${ev.rsvp_by}` });
  }
  return rows.length;
}

/**
 * The morning job: for every live event, does whatever is due today (see dueJobs) and records it, so a
 * second run the same day does nothing. A draw that can't follow the rules isn't recorded, so it's retried
 * (and the host page says so) until it works or the event passes.
 */
export async function runDue(today: string, base: string) {
  const events = await sql<(GiftEvent & { status: string; rsvp_by: string | null; remind_replies: boolean; gift_on: boolean; gift_remind_ideas: boolean; gift_remind_givers: boolean })[]>`
    select id, slug, title, status, date::text, rsvp_by::text, remind_replies, gift_on, gift_draw_on::text, gift_remind_ideas, gift_remind_givers, gift_budget, gift_never
    from events where status = 'live' and date >= ${daysBefore(today, 0)} and (remind_replies or gift_on)`;
  const log: string[] = [];
  for (const e of events) {
    const sent = new Set((await sql<{ job: Job }[]>`select job from sent_jobs where event_id = ${e.id}`).map((r) => r.job));
    for (const job of dueJobs(e, today, sent)) {
      // Claim the job first, so two runs at once can't both draw or both send.
      const [claimed] = await sql`insert into sent_jobs (event_id, job) values (${e.id}, ${job}) on conflict do nothing returning 1`;
      if (!claimed) continue;
      if (job === "gift_draw") {
        const [drawn] = await sql`select 1 from gift_draws where event_id = ${e.id} limit 1`;
        if (!drawn) {
          const r = await drawFor(e);
          if ("error" in r) {
            await sql`delete from sent_jobs where event_id = ${e.id} and job = ${job}`; // try again tomorrow
            log.push(`${e.slug}: draw failed (${r.error})`);
            continue;
          }
        }
      }
      const n = job === "gift_draw" ? (await emailMatchesFor(e, base)).sent
        : job === "gift_ideas" ? await remindIdeas(e, base)
        : job === "gift_givers" ? await remindGivers(e, base)
        : await remindReplies(e, base);
      log.push(`${e.slug}: ${job} (${n})`);
    }
  }
  return log;
}
