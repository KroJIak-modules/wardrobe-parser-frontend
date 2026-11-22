import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

globalThis.window = { location: { origin: "http://localhost:10530" } };

const bundle = await build({
  entryPoints: ["src/site/features/designers/site-designers-navigation.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const navigation = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

test("переход на страницу дизайнеров сохраняет выбор из каталога", () => {
  const result = navigation.prepareSiteDesignersDirectoryNavigation(
    "/designers",
    { designersEntryMode: "browse" },
    "?designer=adidas&section=futbolki-i-longslivy",
  );

  assert.equal(result.to, "/designers?designer=adidas&section=futbolki-i-longslivy");
  assert.deepEqual(result.state, { designersEntryMode: "catalog-filter" });
});

test("несколько выбранных дизайнеров переносятся списком", () => {
  const result = navigation.prepareSiteDesignersDirectoryNavigation(
    "/designers",
    { designersEntryMode: "browse" },
    "?designer=adidas,acne-studios",
  );

  assert.equal(result.to, "/designers?designer=adidas%2Cacne-studios");
  assert.deepEqual(result.state, { designersEntryMode: "catalog-filter" });
});

test("без выбора дизайнеров переход не меняется", () => {
  const result = navigation.prepareSiteDesignersDirectoryNavigation(
    "/designers",
    { designersEntryMode: "browse" },
    "?section=futbolki-i-longslivy",
  );

  assert.equal(result.to, "/designers");
  assert.deepEqual(result.state, { designersEntryMode: "browse" });
});

test("служебные параметры каталога не переносятся", () => {
  const result = navigation.prepareSiteDesignersDirectoryNavigation(
    "/designers",
    undefined,
    "?designer=adidas&top=designers&ctx=menu_filter&page=3",
  );

  const params = new URLSearchParams(result.to.split("?")[1] || "");
  assert.equal(params.get("designer"), "adidas");
  assert.equal(params.get("top"), null);
  assert.equal(params.get("ctx"), null);
  assert.equal(params.get("page"), null);
});

test("переход не на страницу дизайнеров не меняется", () => {
  const result = navigation.prepareSiteDesignersDirectoryNavigation(
    "/catalog",
    undefined,
    "?designer=adidas",
  );

  assert.equal(result.to, "/catalog");
  assert.equal(result.state, undefined);
});
