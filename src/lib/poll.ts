// The event's one poll ("Which Saturday works?"): a question and its choices, one per line. Pure.

/** The choices as the host typed them: trimmed, no blanks or repeats, at most 10. */
export function pollChoices(text: string | null) {
  const seen = new Set<string>();
  return (text ?? "").split("\n").map((c) => c.trim().slice(0, 80)).filter((c) => {
    const k = c.toLowerCase();
    if (!c || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 10);
}

/** On when there's a question and at least two choices to pick from. */
export const pollOn = (e: { poll_question: string | null; poll_choices: string | null }) => !!e.poll_question && pollChoices(e.poll_choices).length > 1;

/** Each choice with the replies that picked it. Picks of choices the host has since removed don't count. */
export function tally<H extends { poll: string[] | null }>(choices: string[], households: H[]) {
  return choices.map((choice) => ({ choice, by: households.filter((h) => h.poll?.includes(choice)) }));
}

/** What the reply form and the invite need, or null when the event has no poll. */
export const pollOf = (e: { poll_question: string | null; poll_choices: string | null }) =>
  pollOn(e) ? { question: e.poll_question!, choices: pollChoices(e.poll_choices) } : null;
