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
const { buildSiteImageSource } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

test("site media urls get width variants from our own endpoint", () => {
  const source = buildSiteImageSource("/api/v1/site/media/173/file", "showcaseSlide");

  assert.equal(source.src, "/api/v1/site/media/173/file?w=1200");
  assert.ok(source.srcSet.includes("/api/v1/site/media/173/file?w=480 480w"));
  assert.ok(source.srcSet.includes("/api/v1/site/media/173/file?w=1616 1616w"));
  assert.equal(source.sizes, "(max-width: 640px) 100vw, 808px");
});

test("shopify urls get width variants from the source cdn", () => {
  const source = buildSiteImageSource(
    "https://cdn.shopify.com/s/files/1/0851/7999/0298/files/DSF0796.jpg?v=1",
    "galleryMain",
  );

  assert.ok(source.srcSet.includes("&width=640 640w"));
  assert.ok(source.srcSet.includes("&width=1920 1920w"));
  assert.equal(source.sizes, "(max-width: 640px) 100vw, 577px");
});

test("unknown hosts are left untouched", () => {
  const source = buildSiteImageSource("https://img07.shop-pro.jp/image.jpg?token=abc", "catalogTile");

  assert.equal(source.src, "https://img07.shop-pro.jp/image.jpg?token=abc");
  assert.equal(source.srcSet, null);
});

test("empty url produces no source", () => {
  const source = buildSiteImageSource(null, "catalogTile");

  assert.equal(source.src, null);
  assert.equal(source.srcSet, null);
});
