import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({ entryPoints: ["src/admin/payments/payments-api.ts"], bundle: true, platform: "node", format: "esm", write: false });
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const draft = { title: "Товар", amount: 100, description: "", email: "a@example.com", phone: "", customer_name: "", address: "", comment: "" };

test("create sends the same idempotency key and payload when retried", async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ id: 1 }), { status: 201 });
  };
  await api.createPayment(draft, "attempt-123");
  await api.createPayment(draft, "attempt-123");
  assert.equal(calls[0].init.headers["Idempotency-Key"], "attempt-123");
  assert.equal(calls[1].init.headers["Idempotency-Key"], "attempt-123");
  assert.equal(calls[0].init.body, calls[1].init.body);
  assert.deepEqual(JSON.parse(calls[0].init.body), draft);
});

test("refresh returns the updated payment", async () => {
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/admin\/payments\/1\/refresh$/);
    assert.equal(init.method, "POST");
    return new Response(JSON.stringify({ id: 1, status: "SUCCESS" }), { status: 200 });
  };
  const result = await api.refreshPayment(1);
  assert.equal(result.status, "SUCCESS");
});

test("refresh propagates provider errors", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Обновление не подтверждено" }), { status: 409 });
  await assert.rejects(api.refreshPayment(1), /Обновление не подтверждено/);
});

test("payment list requests batches of 30 with the requested offset", async () => {
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 });
  };
  await api.listPayments(0);
  await api.listPayments(30);
  assert.match(urls[0], /\/admin\/payments\?limit=30&offset=0$/);
  assert.match(urls[1], /\/admin\/payments\?limit=30&offset=30$/);
});
