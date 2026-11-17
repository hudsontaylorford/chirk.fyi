import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { htmlToText, senderAddress, verifyWebhook } from "./inbound.ts";

const secret = "whsec_" + Buffer.from("a test signing key").toString("base64");
const sign = (id: string, ts: number, body: string) =>
  "v1," + createHmac("sha256", Buffer.from("a test signing key")).update(`${id}.${ts}.${body}`).digest("base64");

test("webhook signatures: only Resend's, only recent", () => {
  const body = '{"type":"email.received"}';
  const now = 1_800_000_000;
  assert.ok(verifyWebhook(secret, "msg_1", String(now), body, sign("msg_1", now, body), now));
  assert.ok(verifyWebhook(secret, "msg_1", String(now), body, `v1,bm9wZQ== ${sign("msg_1", now, body)}`, now)); // one of several
  assert.equal(verifyWebhook(secret, "msg_1", String(now), body + " ", sign("msg_1", now, body), now), false); // body changed
  assert.equal(verifyWebhook(secret, "msg_2", String(now), body, sign("msg_1", now, body), now), false); // other message
  assert.equal(verifyWebhook(secret, "msg_1", String(now - 600), body, sign("msg_1", now - 600, body), now), false); // too old
  assert.equal(verifyWebhook("not-a-secret", "msg_1", String(now), body, sign("msg_1", now, body), now), false);
  assert.equal(verifyWebhook(secret, null, String(now), body, sign("msg_1", now, body), now), false);
});

test("sender and text", () => {
  assert.equal(senderAddress("Hudson Ford <Hudson@Example.com>"), "hudson@example.com");
  assert.equal(senderAddress("sam@example.com"), "sam@example.com");
  assert.equal(senderAddress("nobody"), null);
  assert.equal(htmlToText("<style>p{}</style><p>Dinner&nbsp;at 7</p><p>Bring <b>pie</b> &amp; wine</p>"), "Dinner at 7\nBring pie & wine");
});
