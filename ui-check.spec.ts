import { test, expect } from '@playwright/test';

const mobileViewport = { width: 390, height: 844 };

test('catalog filters drawer replaces old panel', async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto('http://127.0.0.1:10530/catalog?sort=price-desc', {
    waitUntil: 'networkidle',
  });

  await page.getByRole('button', { name: /Фильтры/i }).click();

  const drawer = page.locator('.site-catalog-mobile-filters-drawer');
  await expect(drawer).toBeVisible();

  const info = await page.evaluate(() => {
    const shell = document.querySelector('.site-mobile-drawer-shell__surface');
    const panel = document.querySelector('.site-catalog-mobile__panel');
    const filtersDrawer = document.querySelector('.site-catalog-mobile-filters-drawer');

    if (!(shell instanceof HTMLElement) || !(filtersDrawer instanceof HTMLElement)) {
      return null;
    }

    const shellStyle = window.getComputedStyle(shell);
    const drawerStyle = window.getComputedStyle(filtersDrawer);

    return {
      hasOldPanel: Boolean(panel),
      shellBackground: shellStyle.backgroundColor,
      shellBackdropFilter: shellStyle.backdropFilter,
      shellWebkitBackdropFilter: shellStyle.getPropertyValue('-webkit-backdrop-filter'),
      shellWidth: shellStyle.width,
      drawerLeft: drawerStyle.left,
      drawerTop: drawerStyle.top,
    };
  });

  console.log('FILTERS_INFO', JSON.stringify(info));
  await page.screenshot({ path: '/tmp/catalog-filters-open.png', fullPage: true });
});

test('burger menu shell has glass background', async ({ page }) => {
  await page.setViewportSize(mobileViewport);
  await page.goto('http://127.0.0.1:10530/catalog', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /Меню/i }).click();

  const menu = page.locator('.site-mobile-menu');
  await expect(menu).toBeVisible();

  const info = await page.evaluate(() => {
    const shell = document.querySelector('.site-mobile-drawer-shell__surface');
    const menuRoot = document.querySelector('.site-mobile-menu');

    if (!(shell instanceof HTMLElement) || !(menuRoot instanceof HTMLElement)) {
      return null;
    }

    const shellStyle = window.getComputedStyle(shell);

    return {
      shellBackground: shellStyle.backgroundColor,
      shellBackdropFilter: shellStyle.backdropFilter,
      shellWebkitBackdropFilter: shellStyle.getPropertyValue('-webkit-backdrop-filter'),
      shellWidth: shellStyle.width,
      menuLeft: window.getComputedStyle(menuRoot).left,
    };
  });

  console.log('BURGER_INFO', JSON.stringify(info));
  await page.screenshot({ path: '/tmp/catalog-burger-open.png', fullPage: true });
});
