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
    await page.addInitScript('delete window.BroadcastChannel');
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.addInitScript('delete window.BroadcastChannel');
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

  // Test isolation between different keys/channels
  test('should not sync values between different keys', async ({ page, context }) => {
    // Inject two channels with different keys
    await page.goto('/examples/e2e-sync.html');
    await page.evaluate(() => {
      window.tabSync2 = window.createTabStateSync
        ? window.createTabStateSync('e2e2')
        : undefined;
    });
    const page2 = await context.newPage();
    await page2.goto('/examples/e2e-sync.html');
    await page2.evaluate(() => {
      window.tabSync2 = window.createTabStateSync
        ? window.createTabStateSync('e2e2')
        : undefined;
    });
    // Set value in channel 1
    await page.getByPlaceholder('Type to sync').fill('foo');
    await page.getByText('Set').click();
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('foo');
    // Set value in channel 2 (should not affect #synced)
    await page.evaluate(() => window.tabSync2.set('bar'));
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('foo');
  });

  // Test edge values: null, object, array
  test('should sync null, object, and array values', async ({ page, context }) => {
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.goto('/examples/e2e-sync.html');
    // Sync null
    await page.evaluate(() => window.tabSync.set(null));
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('');
    // Sync object
    await page.evaluate(() => window.tabSync.set({ foo: 'bar' }));
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('[object Object]');
    // Sync array
    await page.evaluate(() => window.tabSync.set([1,2,3]));
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('1,2,3');
  });

  // Sync with more than two tabs
  test('should sync value across three tabs', async ({ page, context }) => {
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.goto('/examples/e2e-sync.html');
    const page3 = await context.newPage();
    await page3.goto('/examples/e2e-sync.html');
    await page.getByPlaceholder('Type to sync').fill('multi');
    await page.getByText('Set').click();
    await page2.waitForTimeout(500);
    await page3.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('multi');
    await expect(page3.locator('#synced')).toHaveText('multi');
  });

  // Destroy instance and check no sync
  test('should not sync after destroy', async ({ page, context }) => {
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.goto('/examples/e2e-sync.html');
    // Destroy tabSync in page2
    await page2.evaluate(() => window.tabSync.destroy());
    await page.getByPlaceholder('Type to sync').fill('destroyed');
    await page.getByText('Set').click();
    await page2.waitForTimeout(500);
    // Should not update after destroy
    await expect(page2.locator('#synced')).not.toHaveText('destroyed');
  });

  // Unsubscribe callback should not receive updates
  test('should not update unsubscribed callback', async ({ page, context }) => {
    await page.goto('/examples/e2e-sync.html');
    // Add a custom callback and unsubscribe
    await page.evaluate(() => {
      window._last = null;
      window._cb = (v) => { window._last = v; };
      window.tabSync.subscribe(window._cb);
      window.tabSync.unsubscribe(window._cb);
    });
    await page.getByPlaceholder('Type to sync').fill('unsub');
    await page.getByText('Set').click();
    await page.waitForTimeout(500);
    // _last should remain null
    const last = await page.evaluate(() => window._last);
    expect(last).toBeNull();
  });

  // Edge: undefined and large values
  test('should sync undefined and large values', async ({ page, context }) => {
    await page.goto('/examples/e2e-sync.html');
    const page2 = await context.newPage();
    await page2.goto('/examples/e2e-sync.html');
    // Sync undefined
    await page.evaluate(() => window.tabSync.set(undefined));
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('');
    // Sync large string
    const big = 'x'.repeat(10000);
    await page.evaluate((b) => window.tabSync.set(b), big);
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText(big);
    // Sync large object
    const bigObj = {};
    for (let i = 0; i < 1000; i++) bigObj['k' + i] = i;
    await page.evaluate((o) => window.tabSync.set(o), bigObj);
    await page2.waitForTimeout(500);
    await expect(page2.locator('#synced')).toHaveText('[object Object]');
  });
}); 