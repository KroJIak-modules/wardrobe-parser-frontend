import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

globalThis.window = { location: { origin: "http://localhost:10530" } };

const bundle = await build({
  entryPoints: ["src/site/features/image/site-image-source.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { buildSiteImageSource, buildSiteImageProbeUrl } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const productImageBundle = await build({
  entryPoints: ["src/shared/product-image.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { matchesImageSource } = await import(
  `data:text/javascript;base64,${Buffer.from(productImageBundle.outputFiles[0].text).toString("base64")}`
);

test("image source keeps the same picture across srcset variants", () => {
  assert.equal(
    matchesImageSource("https://cdn.shopify.com/a.jpg?v=1&width=640", "https://cdn.shopify.com/a.jpg?v=1"),
    true,
  );
  assert.equal(
    matchesImageSource("https://cdn.shopify.com/a.jpg?v=1&width=640", "https://cdn.shopify.com/b.jpg?v=1"),
    false,
  );
  assert.equal(matchesImageSource(null, "https://cdn.shopify.com/a.jpg"), false);
});

test("site media urls get a resized variant", () => {
  const source = buildSiteImageSource("/api/v1/site/media/162/file", "showcaseHero");

  assert.equal(source.src, "/api/v1/site/media/162/file?w=1920");
  assert.ok(source.srcSet.includes("/api/v1/site/media/162/file?w=960 960w"));
});

test("the tone probe uses a small copy instead of the original", () => {
  assert.equal(buildSiteImageProbeUrl("/api/v1/site/media/162/file"), "/api/v1/site/media/162/file?w=320");
  assert.equal(
    buildSiteImageProbeUrl("https://cdn.shopify.com/a.jpg?v=1"),
    "https://cdn.shopify.com/a.jpg?v=1&width=320",
  );
  assert.equal(buildSiteImageProbeUrl(""), null);
});
