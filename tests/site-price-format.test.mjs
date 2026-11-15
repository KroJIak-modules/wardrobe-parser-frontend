import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/site/app/site-format.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const format = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

test("price gets the 'От' prefix only when variant prices differ", () => {
  assert.equal(format.formatSitePriceFrom(25800, true), "От 25\u00a0800 ₽");
  assert.equal(format.formatSitePriceFrom(25800, false), "25\u00a0800 ₽");
});

test("price is formatted with a non-breaking space and thin grouping", () => {
  assert.equal(format.formatSitePriceFrom(1234567, false), "1\u00a0234\u00a0567 ₽");
});
