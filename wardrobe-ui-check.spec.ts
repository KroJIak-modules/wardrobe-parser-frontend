import { expect, test } from "@playwright/test";

const catalogUrl = "http://127.0.0.1:10530/catalog?sort=price-desc";

test("catalog filters drawer replaces old panel and burger shell keeps surface", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(catalogUrl, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /фильтры/i }).click();
  await expect(page.locator(".site-catalog-mobile-filters-drawer")).toBeVisible();

  const filterState = await page.evaluate(() => {
    const drawer = document.querySelector(".site-catalog-mobile-filters-drawer");
    const shell = document.querySelector(".site-mobile-drawer-shell__surface");
    const legacyPanel = document.querySelector(".site-catalog-mobile__panel");
    const computed = shell ? window.getComputedStyle(shell) : null;

    return {
      drawerClass: drawer?.className ?? null,
      legacyPanelExists: Boolean(legacyPanel),
      shellBackground: computed?.backgroundColor ?? null,
      shellBackdropFilter:
        computed?.backdropFilter || computed?.webkitBackdropFilter || null,
    };
  });

  await page.screenshot({ path: "/tmp/catalog-filters-drawer.png", fullPage: true });

  await page.getByRole("button", { name: /закрыть меню фильтров/i }).click();
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: /открыть меню/i }).click();
  await expect(page.locator(".site-mobile-menu")).toBeVisible();

  const burgerState = await page.evaluate(() => {
    const shell = document.querySelector(".site-mobile-drawer-shell__surface");
    const computed = shell ? window.getComputedStyle(shell) : null;

    return {
      shellBackground: computed?.backgroundColor ?? null,
      shellBackdropFilter:
        computed?.backdropFilter || computed?.webkitBackdropFilter || null,
    };
  });

  await page.screenshot({ path: "/tmp/catalog-burger-drawer.png", fullPage: true });

  console.log(JSON.stringify({ filterState, burgerState }, null, 2));
});
