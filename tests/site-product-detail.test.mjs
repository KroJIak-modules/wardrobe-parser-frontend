import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/site/runtime/site-product-detail.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const detail = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

const product = {
  id: "41",
  path: "41-coat",
  name: "Coat",
  brand: "Brand",
  imageSrc: "default.jpg",
  imageAlt: "",
  availability: "Под заказ",
  availabilityCode: "preorder",
  sourceUrl: "https://example.com/",
  sourceVariants: [
    {
      size: "M",
      sources: [
        { id: "one", variantId: 101, priceRub: 100, imageUrls: ["one.jpg"], url: "https://example.com/one" },
        { id: "two", variantId: 102, priceRub: 200, imageUrls: ["two.jpg"], url: "https://example.com/two" },
      ],
    },
  ],
};

test("selected source controls variant, price and cart photo for the same size", () => {
  const source = detail.resolveSiteProductDetailSource(product, "M", "two");
  assert.equal(source.variantId, 102);
  assert.equal(source.priceRub, 200);
  assert.deepEqual(source.imageUrls, ["two.jpg"]);
  const cart = detail.buildSiteCartItemFromProduct(product, "M", "two");
  assert.equal(cart.variantId, 102);
  assert.equal(cart.snapshot.priceRub, 200);
  assert.equal(cart.snapshot.imageSrc, "two.jpg");
});

test("missing price cannot become a zero-priced cart item", () => {
  const missingPrice = {
    ...product,
    sourceVariants: [{ size: "M", sources: [{ ...product.sourceVariants[0].sources[0], priceRub: null }] }],
  };
  assert.throws(() => detail.buildSiteCartItemFromProduct(missingPrice, "M"), /без цены/);
});
