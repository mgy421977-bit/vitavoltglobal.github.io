const { test, expect } = require('@playwright/test');

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 }
];

const productIds = [
  'vita-energy',
  'vita-storage',
  'vita-carbon',
  'vita-water',
  'vita-intelligence',
  'vita-epc'
];

test.describe('Services page responsive browser QA', () => {
  for (const viewport of viewports) {
    test(`portfolio layout at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);

      const pageErrors = [];
      const failedLocalRequests = [];
      const badLocalResponses = [];

      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('requestfailed', request => {
        const url = new URL(request.url());
        if (url.origin === 'http://127.0.0.1:4173') {
          failedLocalRequests.push(`${request.method()} ${url.pathname}: ${request.failure()?.errorText || 'request failed'}`);
        }
      });
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === 'http://127.0.0.1:4173' && response.status() >= 400) {
          badLocalResponses.push(`${response.status()} ${url.pathname}`);
        }
      });

      await page.goto('/services.html', { waitUntil: 'networkidle' });

      await expect(page.locator('#product-architecture-title')).toBeVisible();
      for (const id of productIds) {
        await expect(page.locator(`#${id}`)).toHaveCount(1);
        await expect(page.locator(`#${id} h3`)).toBeVisible();
      }

      await expect(page.locator('.vv-product-row')).toHaveCount(6);
      await expect(page.locator('.vv-product-boundary')).toContainText('Vitavolt Research');
      await expect(page.locator('#navMenu a[href="/research/"]')).toHaveCount(1);

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow, 'document should not overflow horizontally').toBe(false);

      const images = page.locator('.vv-product-media img');
      const imageCount = await images.count();
      for (let index = 0; index < imageCount; index += 1) {
        await expect.poll(async () => images.nth(index).evaluate(img => img.complete && img.naturalWidth > 0))
          .toBe(true);
      }

      const productLinks = page.locator('.vv-product-row .vv-product-copy > a.btn');
      await expect(productLinks).toHaveCount(6);
      for (let index = 0; index < await productLinks.count(); index += 1) {
        const href = await productLinks.nth(index).getAttribute('href');
        expect(href, 'product link should have an href').toBeTruthy();
        const response = await page.request.get(new URL(href, 'http://127.0.0.1:4173').toString());
        expect(response.status(), `product link ${href} should return a successful response`).toBeLessThan(400);
      }

      const screenshotPath = testInfo.outputPath(`services-${viewport.width}x${viewport.height}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });

      expect(pageErrors, 'page should not emit uncaught JavaScript errors').toEqual([]);
      expect(failedLocalRequests, 'local asset requests should not fail').toEqual([]);
      expect(badLocalResponses, 'local assets should not return HTTP errors').toEqual([]);
    });
  }

  test('mobile navigation opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services.html', { waitUntil: 'networkidle' });

    const toggle = page.locator('#menuToggle');
    const menu = page.locator('#navMenu');
    const overlay = page.locator('#menuOverlay');

    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(menu).toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(overlay).toHaveClass(/active/);

    await overlay.click({ force: true });
    await expect(menu).not.toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(overlay).not.toHaveClass(/active/);
  });
});
