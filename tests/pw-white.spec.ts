import { test } from '@playwright/test';

test('capture console', async ({ page }) => {
  page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR', err.message));
  page.on('requestfailed', (req) => console.log('REQFAIL', req.url(), req.failure()?.errorText));
  await page.goto('http://localhost:10530/');
  await page.waitForTimeout(1500);
});
