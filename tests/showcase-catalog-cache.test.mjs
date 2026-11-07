import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/admin/showcase-catalog-cache.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const cache = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

test("catalog pages and filters have independent snapshots", () => {
  cache.clearShowcaseCatalogCache();
  const first = "default:/catalog";
  const second = "default:/catalog?page=2";
  const products = { items: [{ id: 42 }], total: 100 };
  const experience = { view: { header: { title: "All" } }, filterGroups: [] };
  cache.updateShowcaseCatalogCache(first, { products });
  cache.updateShowcaseCatalogCache(first, { experience });
  cache.updateShowcaseCatalogCache(second, { products: { items: [{ id: 43 }], total: 100 } });
  assert.deepEqual(cache.readShowcaseCatalogCache(first), { products, experience });
  assert.equal(cache.readShowcaseCatalogCache(second).products.items[0].id, 43);
  assert.equal(cache.readShowcaseCatalogCache("default:/catalog?q=other"), undefined);
});

test("cache is bounded and is cleared between admin sessions", () => {
  cache.clearShowcaseCatalogCache();
  for (let index = 0; index < 21; index++) {
    cache.updateShowcaseCatalogCache(`page-${index}`, { products: { items: [], total: index } });
  }
  assert.equal(cache.readShowcaseCatalogCache("page-0"), undefined);
  assert.equal(cache.readShowcaseCatalogCache("page-20").products.total, 20);
  cache.clearShowcaseCatalogCache();
  assert.equal(cache.readShowcaseCatalogCache("page-20"), undefined);
});
