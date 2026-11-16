"use server";

import { currentUser } from "@/lib/auth";
import { MAX_SEARCH, MIN_SEARCH, PLACE_ID, PlacesError, allowRequest, type PlaceSuggestion, type PlacesProblem } from "@/lib/places";
import { placesProvider } from "@/lib/places-provider";

// Google address search for signed-in hosts. Search text is never stored or logged; any failure just hides
// Google's suggestions, so typing a place by hand always works. Google's daily quotas are the hard cap on cost.
type Result<T> = { ok: true; value: T } | { ok: false; problem: PlacesProblem };
const recent = new Map<string, number[]>();

async function lookup<T>(kind: "suggest" | "address", run: (p: NonNullable<ReturnType<typeof placesProvider>>) => Promise<T>): Promise<Result<T>> {
  const me = await currentUser();
  const provider = me ? placesProvider() : null;
  if (!me || !provider) return { ok: false, problem: "off" };
  if (!allowRequest(recent, `${kind}:${me.id}`, Date.now(), kind === "suggest" ? 40 : 15, 60_000)) return { ok: false, problem: "quota" };
  try {
    return { ok: true, value: await run(provider) };
  } catch (e) {
    return { ok: false, problem: e instanceof PlacesError ? e.problem : "unavailable" };
  }
}

/** Suggestions for what's been typed in the Place box (3+ characters). */
export async function placeSuggestions(input: string): Promise<Result<PlaceSuggestion[]>> {
  const q = typeof input === "string" ? input.trim().slice(0, MAX_SEARCH) : "";
  if (q.length < MIN_SEARCH) return { ok: true, value: [] };
  return lookup("suggest", (p) => p.suggest(q));
}

/** The address for a picked suggestion (Geocoding, which may be kept on the event). */
export async function placeAddress(placeId: string): Promise<Result<string>> {
  if (typeof placeId !== "string" || !PLACE_ID.test(placeId)) return { ok: false, problem: "not_found" };
  return lookup("address", (p) => p.address(placeId));
}
