// The one place chirk calls Claude. Server-only: the key (ANTHROPIC_API_KEY) never reaches the browser.
// Adapted from crew-scheduler's src/lib/import/interpret.ts.
import Anthropic from "@anthropic-ai/sdk";
import { SCHEMA, SYSTEM, toImported, type FileType, type Imported } from "./import";

const MODEL = "claude-opus-5-5";
const fakeOn = () => process.env.AI_FAKE === "true" && process.env.VERCEL_ENV !== "production";

/** Whether "Paste a text or screenshot" shows: with the key, or the local stand-in. */
export const importOn = () => fakeOn() || !!process.env.ANTHROPIC_API_KEY?.trim();

/** A message the host can act on; anything else is a bug. */
export class ImportProblem extends Error {}

export async function readPlan(text: string, file: { type: FileType; base64: string } | null, today: string): Promise<Imported> {
  if (fakeOn()) {
    // A fixed, fictional answer for local work and tests.
    return toImported({
      title: "Sample dinner", date: "2026-12-05", start_time: "19:00", end_time: "", place: "Sample Hall", address: "335 Example Ave",
      message: "Bring a sweater, the patio gets cold.", schedule: [], bring: ["Salad", "Dessert"],
    });
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new ImportProblem("Reading isn't set up yet (the AI key is missing). Fill in the form by hand.");

  const client = new Anthropic();
  const request = {
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" as const, format: { type: "json_schema" as const, schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: "user" as const,
      content: [
        ...(file
          ? [file.type === "application/pdf"
            ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: file.base64 } }
            : { type: "image" as const, source: { type: "base64" as const, media_type: file.type, data: file.base64 } }]
          : []),
        { type: "text" as const, text: `Today is ${today} (New York).\n\n<pasted>\n${text || "(nothing typed; read the attachment)"}\n</pasted>` },
      ],
    }],
  };
  try {
    let res;
    try {
      // If the model declines, the API retries on another model in the same call.
      res = await client.beta.messages.create({ ...request, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
    } catch (e) {
      if (!(e instanceof Anthropic.BadRequestError && /fallback|beta/i.test(e.message))) throw e;
      res = await client.beta.messages.create(request); // accounts without the fallback option yet
    }
    if (res.stop_reason === "refusal") throw new ImportProblem("That couldn't be read. Try different wording, or fill in the form by hand.");
    const out = res.content.find((b) => b.type === "text");
    if (res.stop_reason === "max_tokens" || !out || out.type !== "text") throw new ImportProblem("That was too much to read at once. Try a shorter piece.");
    return toImported(JSON.parse(out.text));
  } catch (e) {
    if (e instanceof ImportProblem) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new ImportProblem("The AI key was rejected. Check ANTHROPIC_API_KEY in Vercel.");
    if (e instanceof Anthropic.RateLimitError) throw new ImportProblem("The AI is busy right now. Wait a minute and try again.");
    if (e instanceof Anthropic.APIError) {
      console.error("readPlan API error", e.status, e.message);
      if (/credit balance/i.test(e.message)) throw new ImportProblem("The AI account is out of credits. Add credits at console.anthropic.com (Billing), then try again.");
      if (e.status === 413) throw new ImportProblem("That file is too big to read. Try a screenshot of just the part with the plan.");
      throw new ImportProblem(`The AI service had a problem${e.status ? ` (${e.status})` : ""}. Try again, or fill in the form by hand.`);
    }
    if (e instanceof SyntaxError) throw new ImportProblem("That couldn't be read. Try again, or fill in the form by hand.");
    throw e;
  }
}
