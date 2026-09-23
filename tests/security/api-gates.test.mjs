import test from 'node:test';
import assert from 'node:assert/strict';

for (const name of ['ai', 'web-scanner', 'surface-recon', 'tls-insight', 'analyze-screenshot', 'cve-search']) {
  test(`${name} rejects the original malformed-token case before body/provider processing`, async () => {
    const { default: handler } = await import(`../../api/${name}.js`);
    for (const authorization of ['', 'Bearer not-a-valid-firebase-token']) {
      const res = {
        code: 0, payload: null, setHeader() {},
        status(code) { this.code = code; return this; },
        json(payload) { this.payload = payload; return this; },
      };
      await handler({ method: 'POST', headers: { authorization }, body: {}, socket: {} }, res);
      assert.equal(res.code, 401);
      assert.deepEqual(res.payload, { error: 'Unauthorized' });
    }
  });
}
