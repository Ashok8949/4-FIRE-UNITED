import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src";

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

describe("4FU Worker request validation", () => {
  it("rejects an invalid UID in the direct worker handler", async () => {
    const request = new Request("http://example.com/?assetdebug=1&uid=invalid");
    const ctx = createExecutionContext();

    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: "Invalid UID",
    });
  });

  it("rejects an invalid UID through the Workers integration runtime", async () => {
    const response = await SELF.fetch(
      "http://example.com/?assetdebug=1&uid=invalid"
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: "Invalid UID",
    });
  });

});

describe("4FU PRO webhook request validation", () => {
  it("rejects a webhook with an invalid Razorpay signature", async () => {
    const request = new Request("http://example.com/pro/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": "invalid",
      },
      body: JSON.stringify({ event: "subscription.activated" }),
    });

    const response = await worker.fetch(
      request,
      { ...env, RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret" },
      createExecutionContext()
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid webhook signature");
  });

  it("rejects a correctly signed but malformed webhook payload", async () => {
    const secret = "test-webhook-secret";
    const body = "{not-json";
    const signature = await hmacHex(secret, body);
    const request = new Request("http://example.com/pro/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": signature,
      },
      body,
    });

    const response = await worker.fetch(
      request,
      { ...env, RAZORPAY_WEBHOOK_SECRET: secret },
      createExecutionContext()
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid webhook payload");
  });

  it("acknowledges a signed event without a subscription entity without changing entitlements", async () => {
    const secret = "test-webhook-secret";
    const body = JSON.stringify({
      id: "evt_test_payment_only",
      event: "payment.authorized",
      payload: { payment: { entity: { id: "pay_test" } } },
    });
    const signature = await hmacHex(secret, body);
    const request = new Request("http://example.com/pro/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": signature,
      },
      body,
    });

    const response = await worker.fetch(
      request,
      { ...env, RAZORPAY_WEBHOOK_SECRET: secret },
      createExecutionContext()
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Webhook received");
  });
});
