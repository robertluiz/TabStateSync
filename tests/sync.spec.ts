import { test, expect } from '@playwright/test';

// You need a local server running on http://localhost:8080/examples/e2e-sync.html

test.describe('TabStateSync cross-tab sync', () => {
  test('should sync value between two tabs (BroadcastChannel)', async ({ page, context }) => {
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.goto('/examples/e2e-sync.html');

    await page.getByPlaceholder('Type to sync').fill('foo');
    await page.getByText('Set').click();
    await expect(page.locator('#synced')).toHaveText('foo');
    // Aguarda propagação
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('foo');

    await page2.getByPlaceholder('Type to sync').fill('bar');
    await page2.getByText('Set').click();
    await expect(page2.locator('#synced')).toHaveText('bar');
    await page.waitForTimeout(500);
    await expect(page.locator('#synced')).toHaveText('bar');
  });

  test('should sync value between two tabs (localStorage fallback)', async ({ page, context }) => {
    await page.addInitScript(() => { window.BroadcastChannel = undefined; });
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.addInitScript(() => { window.BroadcastChannel = undefined; });
    await page2.goto('/examples/e2e-sync.html');

    await page.getByPlaceholder('Type to sync').fill('baz');
    await page.getByText('Set').click();
    await expect(page.locator('#synced')).toHaveText('baz');
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('baz');

    await page2.getByPlaceholder('Type to sync').fill('qux');
    await page2.getByText('Set').click();
    await expect(page2.locator('#synced')).toHaveText('qux');
    await page.waitForTimeout(500);
    await expect(page.locator('#synced')).toHaveText('qux');
  });
}); 