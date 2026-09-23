import test from "node:test";
import assert from "node:assert/strict";
import {
  createReadinessClient,
  WorkspaceError,
} from "../../src/v2/api-client.js";

test("readiness client sends verified token, encodes identifiers and opts out of caching", async () => {
  let request;
  const client = createReadinessClient(
    async () => "verified-token",
    async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ data: { value: true } }) };
    },
  );
  const controller = new AbortController();
  assert.deepEqual(
    await client.evidence("org-a", "exercise:1", controller.signal),
    { value: true },
  );
  assert.ok(request.url.includes("exercise_id=exercise%3A1"));
  assert.equal(request.options.headers.Authorization, "Bearer verified-token");
  assert.equal(request.options.cache, "no-store");
  assert.equal(request.options.signal, controller.signal);
});
test("missing identity never sends a readiness request", async () => {
  let called = false;
  const client = createReadinessClient(
    async () => undefined,
    async () => {
      called = true;
    },
  );
  await assert.rejects(
    client.context(),
    (error) => error instanceof WorkspaceError && error.status === 401,
  );
  assert.equal(called, false);
});
for (const status of [401, 403, 404, 409, 503]) {
  test(`readiness client exposes a safe ${status} state without stale data fallback`, async () => {
    const client = createReadinessClient(
      async () => "token",
      async () => ({ ok: false, status }),
    );
    await assert.rejects(
      client.index("org-a"),
      (error) => error instanceof WorkspaceError && error.status === status,
    );
  });
}
test("malformed success payload is not treated as a populated workspace", async () => {
  const client = createReadinessClient(
    async () => "token",
    async () => ({ ok: true, json: async () => ({}) }),
  );
  await assert.rejects(client.context(), /incomplete response/);
});
