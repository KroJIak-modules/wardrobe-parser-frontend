import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

globalThis.window = { location: { origin: "http://localhost:10531" } };
const bundle = await build({
  entryPoints: ["src/shared/product-image.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const image = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

test("Shopify srcset preserves the original query and provides high-density sizes", () => {
  const source = "https://cdn.shopify.com/s/files/1/photo.jpg?v=123";
  const entries = image.getShopifyImageSrcSet(source).split(", ");
  assert.deepEqual(entries.map((entry) => entry.split(" ")[1]), ["480w", "640w", "960w", "1280w"]);
  for (const entry of entries) {
    const [url, descriptor] = entry.split(" ");
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("v"), "123");
    assert.equal(parsed.searchParams.get("width"), descriptor.slice(0, -1));
  }
});

test("unknown, signed, local and lookalike hosts never receive a srcset", () => {
  for (const source of [
    "https://img07.shop-pro.jp/photo.jpg?signature=abc",
    "https://cdn.shopify.com.example.org/photo.jpg",
    "/api/v1/products/images/1",
    "data:image/png;base64,abc",
    null,
  ]) {
    assert.equal(image.getShopifyImageSrcSet(source), undefined);
  }
});
