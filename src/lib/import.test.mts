import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffType, toAnswer, toImported } from "./import.ts";

test("import: keeps well-formed values, drops odd ones, never invents", () => {
  const good = toImported({
    title: " Friendsgiving ", date: "2026-11-21", start_time: "18:30", end_time: "23:00", place: "Our place", address: "56 Bogart St",
    message: "Street parking only.", schedule: ["6:30 pm Drinks", "7:30 pm Dinner"], bring: ["Pie", "", "Wine"],
  });
  assert.deepEqual(good.set, {
    title: "Friendsgiving", date: "2026-11-21", time: "18:30:00", end_time: "23:00:00", place: "Our place", address: "56 Bogart St",
    details: "Street parking only.", schedule: "6:30 pm Drinks\n7:30 pm Dinner", bring_prompt: "What are you bringing?",
  });
  assert.deepEqual(good.items, ["Pie", "Wine"]);
  assert.deepEqual(toImported(toAnswer(good)), good); // carried to New event and read again, nothing lost

  // Bad dates and times are left for the host, an end time needs a start, one schedule line isn't a schedule.
  const odd = toImported({ title: "", date: "2026-02-30", start_time: "7pm", end_time: "23:00", place: "", address: "", message: "", schedule: ["7 pm Dinner"], bring: [] });
  assert.deepEqual(odd, { set: {}, items: [] });
  assert.deepEqual(toImported(null), { set: {}, items: [] });
  assert.deepEqual(toImported({ title: 42, bring: "Pie" }), { set: {}, items: [] });
  assert.equal(toImported({ title: "x".repeat(200) }).set.title?.length, 80);
});

test("files: the type comes from the first bytes", () => {
  assert.equal(sniffType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), "application/pdf");
  assert.equal(sniffType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(sniffType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(sniffType(new TextEncoder().encode("<html>hello")), null);
});
