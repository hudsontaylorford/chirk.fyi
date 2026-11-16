// Google address search, the network side. The only file that reads GOOGLE_PLACES_API_KEY (a unit test checks):
// it runs on the server, and the key is never sent to the browser or logged.
import { AUTOCOMPLETE_FIELD_MASK, PlacesError, autocompleteBody, autocompleteProblem, parseGeocode, parseSuggestions, type PlaceSuggestion } from "./places";

type Provider = { suggest(input: string): Promise<PlaceSuggestion[]>; address(placeId: string): Promise<string> };

const fakeOn = () => process.env.PLACES_FAKE === "true" && process.env.VERCEL_ENV !== "production";

/** Whether the Place box searches Google: with the key, or the local stand-in. */
export const placesOn = () => fakeOn() || !!process.env.GOOGLE_PLACES_API_KEY?.trim();

export function placesProvider(): Provider | null {
  if (fakeOn()) return FAKE;
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return key ? google(key) : null;
}

function google(key: string): Provider {
  const call = async (url: string, init: RequestInit) => {
    try {
      return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(2500) });
    } catch {
      throw new PlacesError("unavailable");
    }
  };
  return {
    async suggest(input) {
      const res = await call("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK },
        body: JSON.stringify(autocompleteBody(input)),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw autocompleteProblem(res.status, json);
      return parseSuggestions(json);
    },
    async address(placeId) {
      const params = new URLSearchParams({ place_id: placeId, language: "en", key });
      const res = await call(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { method: "GET" });
      return parseGeocode(await res.json().catch(() => null));
    },
  };
}

// Fictional places for local work and tests (PLACES_FAKE=true, never on the live site).
const PLACES = [
  { placeId: "fake-sample-hall-00001", main: "Sample Hall", secondary: "335 Example Ave, New York, NY, USA", address: "335 Example Ave, New York, NY 10003" },
  { placeId: "fake-example-park-0002", main: "Example Park", secondary: "12 Example Street, Brooklyn, NY, USA", address: "12 Example Street, Brooklyn, NY 11206" },
];
const FAKE: Provider = {
  async suggest(input) {
    const words = input.toLowerCase().split(/\s+/).filter(Boolean);
    return PLACES.filter((p) => words.every((w) => `${p.main} ${p.secondary}`.toLowerCase().includes(w))).map(({ placeId, main, secondary }) => ({ placeId, main, secondary }));
  },
  async address(placeId) {
    const p = PLACES.find((f) => f.placeId === placeId);
    if (!p) throw new PlacesError("not_found");
    return p.address;
  },
};
