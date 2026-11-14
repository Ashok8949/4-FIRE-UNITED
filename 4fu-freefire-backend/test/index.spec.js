import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src";

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
