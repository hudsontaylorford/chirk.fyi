import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PlacesError, US_BIAS, allowRequest, autocompleteBody, autocompleteProblem, nearFrom, parseGeocode, parseSuggestions } from "./places.ts";

test("suggestions: only real place predictions, at most 5", () => {
  const p = (id: string, main: string, secondary?: string) => ({ placePrediction: { placeId: id, structuredFormat: { mainText: { text: main }, ...(secondary ? { secondaryText: { text: secondary } } : {}) } } });
  const json = { suggestions: [p("ChIJabc1234567", "Commerce Inn", "50 Commerce St, New York"), { queryPrediction: {} }, p("bad id!", "Nope"), p("ChIJdef1234567", " ")] };
  assert.deepEqual(parseSuggestions(json), [{ placeId: "ChIJabc1234567", main: "Commerce Inn", secondary: "50 Commerce St, New York" }]);
  assert.deepEqual(parseSuggestions(null), []);
  assert.equal(parseSuggestions({ suggestions: Array.from({ length: 9 }, (_, i) => p(`ChIJplace${i}0000`, `P${i}`)) }).length, 5);
  assert.equal(autocompleteBody("  x".repeat(100)).input.length, 120);
});

test("geocode: one line without the country, and plain problems", () => {
  assert.equal(parseGeocode({ status: "OK", results: [{ formatted_address: "50 Commerce St, New York, NY 10014, USA" }] }), "50 Commerce St, New York, NY 10014");
  assert.equal(parseGeocode({ status: "OK", results: [{ formatted_address: "8 Sample Lane, London W1 1AA, UK" }] }), "8 Sample Lane, London W1 1AA, UK");
  const problem = (json: unknown) => { try { parseGeocode(json); } catch (e) { return (e as PlacesError).problem; } };
  assert.equal(problem({ status: "ZERO_RESULTS" }), "not_found");
  assert.equal(problem({ status: "OVER_QUERY_LIMIT" }), "quota");
  assert.equal(problem({ status: "REQUEST_DENIED" }), "unavailable");
  assert.equal(problem(null), "unavailable");
  assert.equal(autocompleteProblem(429, null).problem, "quota");
  assert.equal(autocompleteProblem(403, { error: { status: "PERMISSION_DENIED" } }).problem, "unavailable");
});

test("per-person limit", () => {
  const log = new Map<string, number[]>();
  for (let i = 0; i < 3; i++) assert.ok(allowRequest(log, "a", 1000 + i, 3, 60_000));
  assert.equal(allowRequest(log, "a", 1003, 3, 60_000), false);
  assert.ok(allowRequest(log, "b", 1003, 3, 60_000)); // per person
  assert.ok(allowRequest(log, "a", 70_000, 3, 60_000)); // the window moves on
});

test("the Google key is read in one server-only file", () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
  const users = files("src").filter((f) => /\.(ts|tsx)$/.test(f) && readFileSync(f, "utf8").includes("GOOGLE_PLACES_API_KEY"));
  assert.deepEqual(users, [join("src", "lib", "places-provider.ts")]);
  assert.ok(!readFileSync(join("src", "lib", "places-provider.ts"), "utf8").includes("use client"));
});

test("nearby first: Vercel's city guess becomes a 50 km bias, else the US", () => {
  const near = nearFrom("40.6782", "-73.9442");
  assert.deepEqual(near, { latitude: 40.6782, longitude: -73.9442 });
  assert.deepEqual(autocompleteBody("metlife", near).locationBias, { circle: { center: near, radius: 50_000 } });
  assert.deepEqual(autocompleteBody("metlife", null).locationBias, US_BIAS);
  for (const [lat, lng] of [[null, null], ["", "1"], ["abc", "1"], ["95", "1"], ["1", "200"]] as const) assert.equal(nearFrom(lat, lng), null);
});
