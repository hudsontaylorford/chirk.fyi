/**
 * Google address search, the plain parts (no network, no secrets). Copied from crew-scheduler's
 * src/lib/places/parse.ts (its docs/google-places.md has the terms reading this follows):
 * - Places API (New) Autocomplete suggests places while a host types. Its names and descriptions are shown, never stored.
 * - The Geocoding API, asked by place id, gives the address, which may be kept to show on the event.
 * So a pick fills the Address box from Geocoding, and the Place box keeps the host's own words.
 */

export type PlaceSuggestion = { placeId: string; main: string; secondary: string | null };
export type PlacesProblem = "off" | "quota" | "unavailable" | "not_found";

export class PlacesError extends Error {
  problem: PlacesProblem;
  constructor(problem: PlacesProblem) {
    super(problem);
    this.problem = problem;
  }
}

/** The contiguous US, to prefer (not limit to) US results. */
export const US_BIAS = { rectangle: { low: { latitude: 24.4, longitude: -124.8 }, high: { latitude: 49.4, longitude: -66.9 } } };
export const AUTOCOMPLETE_FIELD_MASK = "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat";
export const MIN_SEARCH = 3;
export const MAX_SEARCH = 120;
/** Google place ids are opaque; a sanity check before sending one back. */
export const PLACE_ID = /^[A-Za-z0-9_-]{10,400}$/;

export function autocompleteBody(input: string) {
  return { input: input.trim().slice(0, MAX_SEARCH), languageCode: "en", regionCode: "us", locationBias: US_BIAS };
}

type Text = { text?: unknown } | undefined;
const str = (t: Text) => (t && typeof t.text === "string" && t.text.trim() ? t.text.trim() : null);

/** Autocomplete (New) suggestions; anything that isn't a place prediction is skipped. */
export function parseSuggestions(json: unknown, limit = 5): PlaceSuggestion[] {
  const list = (json as { suggestions?: unknown[] } | null)?.suggestions;
  if (!Array.isArray(list)) return [];
  const out: PlaceSuggestion[] = [];
  for (const s of list) {
    const p = (s as { placePrediction?: { placeId?: unknown; structuredFormat?: { mainText?: Text; secondaryText?: Text } } })?.placePrediction;
    if (!p || typeof p.placeId !== "string" || !PLACE_ID.test(p.placeId)) continue;
    const main = str(p.structuredFormat?.mainText);
    if (!main) continue;
    out.push({ placeId: p.placeId, main, secondary: str(p.structuredFormat?.secondaryText) });
    if (out.length >= limit) break;
  }
  return out;
}

/** The one-line address from a Geocoding answer, without the trailing ", USA" (guests don't need it). */
export function parseGeocode(json: unknown): string {
  const body = json as { status?: string; results?: { formatted_address?: string }[] } | null;
  const status = body?.status ?? "UNKNOWN_ERROR";
  if (status === "ZERO_RESULTS") throw new PlacesError("not_found");
  if (status === "OVER_QUERY_LIMIT" || status === "OVER_DAILY_LIMIT") throw new PlacesError("quota");
  const address = body?.results?.[0]?.formatted_address?.trim();
  if (status !== "OK" || !address) throw new PlacesError(status === "OK" ? "not_found" : "unavailable");
  return address.replace(/,\s*USA$/, "");
}

/** Places API (New) error → a problem the field can show quietly. */
export function autocompleteProblem(httpStatus: number, json: unknown): PlacesError {
  const err = (json as { error?: { status?: string } } | null)?.error;
  if (httpStatus === 429 || err?.status === "RESOURCE_EXHAUSTED") return new PlacesError("quota");
  return new PlacesError("unavailable");
}

/** A sliding-window limit per person (best effort, per server instance). Google's daily quotas are the hard cap on cost. */
export function allowRequest(log: Map<string, number[]>, key: string, now: number, limit: number, windowMs: number): boolean {
  const recent = (log.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    log.set(key, recent);
    return false;
  }
  recent.push(now);
  log.set(key, recent);
  return true;
}
