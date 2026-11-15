import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/admin/hooks/admin-source-pricing-helpers.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const helpers = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

const baseSettings = {
  eur_to_usd_rate: 1.1,
  gbp_to_usd_rate: 1.4,
  jpy_to_usd_rate: 0.0065,
  usdt_to_rub_rate: 100,
  usdt_extra_rub: 0,
  usd_to_rub_rate: 100,
  eur_to_rub_rate: 110,
};

test("usd to rub rate includes the bybit markup", () => {
  const rates = helpers.computePricingRates({ ...baseSettings, usdt_extra_rub: 5 }, {});

  assert.equal(rates.usdToRub, 105);
  assert.equal(rates.eurToRub, 1.1 * 105);
  assert.equal(rates.gbpToRub, 1.4 * 105);
});

test("draft values win over persisted settings", () => {
  const rates = helpers.computePricingRates(
    { ...baseSettings, usdt_extra_rub: 5 },
    { usdt_to_rub_rate: "90", usdt_extra_rub: "2", eur_to_usd_rate: "1.05" },
  );

  assert.equal(rates.usdToRub, 92);
  assert.equal(rates.eurToRub, 1.05 * 92);
});
