// The event's questions ("Which shoe?", "Your size?"): up to 5, each with chips guests pick one or any of,
// or with no choices: a tick box ("Allergies?") that opens a box to write in. Pure.

export type Question = { q: string; choices: string[]; one: boolean };
export type Answers = Record<string, string[]>; // question → what they picked

export const MAX_QUESTIONS = 5;

/** The choices as the host typed them: trimmed, no blanks or repeats, at most 20 (half sizes fit). */
export function pollChoices(text: string | null) {
  const seen = new Set<string>();
  return (text ?? "").split("\n").map((c) => c.trim().slice(0, 80)).filter((c) => {
    const k = c.toLowerCase();
    if (!c || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 20);
}

/** No choices: a tick box with a write-in. */
export const writeIn = (x: Question) => !x.choices.length;

/** The questions guests see: write-ins, and ones with at least two choices to pick from. */
export const questionsOf = (e: { questions: Question[] | null }) => (e.questions ?? []).filter((x) => x.q && (writeIn(x) || x.choices.length > 1));

/** From the event form's question_0, choices_0, one_0 … fields. A question without choices is kept so it isn't lost mid-edit. */
export function questionsFromForm(get: (name: string) => string, on: (name: string) => boolean): Question[] {
  const out: Question[] = [];
  for (let i = 0; i < MAX_QUESTIONS; i++) {
    const q = get(`question_${i}`).trim().slice(0, 120);
    if (q && !out.some((x) => x.q === q)) out.push({ q, choices: pollChoices(get(`choices_${i}`)), one: on(`one_${i}`) });
  }
  return out;
}

/** Only real choices of real questions; a pick-one question keeps its first pick; a write-in keeps its text. */
export function cleanAnswers(qs: Question[], input: Answers | undefined): Answers {
  const out: Answers = {};
  for (const x of qs) {
    const text = writeIn(x) ? String(input?.[x.q]?.[0] ?? "").trim().slice(0, 500) : "";
    if (text) out[x.q] = [text];
    const picks = x.choices.filter((c) => input?.[x.q]?.includes(c));
    if (picks.length) out[x.q] = x.one ? picks.slice(0, 1) : picks;
  }
  return out;
}

/** What one reply picked for a question, ignoring choices the host has since removed. */
export const picked = (x: Question, h: { answers: Answers | null }) => writeIn(x) ? (h.answers?.[x.q] ?? []).slice(0, 1) : x.choices.filter((c) => h.answers?.[x.q]?.includes(c));

/** Each choice with the replies that picked it. */
export const tally = <H extends { answers: Answers | null }>(x: Question, households: H[]) =>
  x.choices.map((choice) => ({ choice, by: households.filter((h) => h.answers?.[x.q]?.includes(choice)) }));

/** Every reply as tab-separated rows (pastes into a spreadsheet): name, email, reply, each question, the note. */
export function answersTable(e: { questions: Question[] | null; note_prompt: string | null }, households: { names: string[]; email: string | null; going: boolean | null; note: string | null; answers: Answers | null }[]) {
  const qs = questionsOf(e);
  const cell = (s: string) => s.replace(/\s*\n\s*/g, ", ").replace(/\t/g, " "); // an address typed on lines stays in one cell
  const rows = [
    ["Name", "Email", "Reply", ...qs.map((x) => x.q), e.note_prompt || "Note"],
    ...households.map((h) => [
      h.names.join(" & "), h.email ?? "", h.going === null ? "No reply yet" : h.going ? "Going" : "Can't make it",
      ...qs.map((x) => picked(x, h).join(", ")), h.note ?? "",
    ]),
  ];
  return rows.map((r) => r.map(cell).join("\t")).join("\n");
}
