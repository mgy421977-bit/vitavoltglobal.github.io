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

      const screenshotPath = testInfo.outputPath(`services-${viewport.width}x${viewport.height}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });

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
        const image = images.nth(index);
        await image.scrollIntoViewIfNeeded();
        await expect.poll(async () => image.evaluate(img => img.complete && img.naturalWidth > 0))
          .toBe(true);
      }

      const productLinks = page.locator(".vv-product-row .vv-product-copy > a[class*='btn']");
      await expect(productLinks).toHaveCount(6);
      for (let index = 0; index < await productLinks.count(); index += 1) {
        const href = await productLinks.nth(index).getAttribute('href');
        expect(href, 'product link should have an href').toBeTruthy();
        const response = await page.request.get(new URL(href, 'http://127.0.0.1:4173').toString());
        expect(response.status(), `product link ${href} should return a successful response`).toBeLessThan(400);
      }

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
    const overlay = page.locator('.menu-overlay');

    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(menu).toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(overlay).toHaveClass(/active/);

    await toggle.click();
    await expect(menu).not.toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(overlay).toBeHidden();
  });
});

test.describe('Homepage and Research launch QA', () => {
  test('homepage renders industrial positioning and Research navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Enerjiden Veriye');
    await expect(page.locator('#sektorler')).toBeVisible();
    await expect(page.locator('#navMenu a[href="/research/"]')).toHaveCount(1);
    await expect(page.locator('#navMenu a[href="/research/"]')).toContainText('RESEARCH');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, 'homepage should not overflow horizontally on mobile').toBe(false);
    expect(errors, 'homepage should not emit uncaught JavaScript errors').toEqual([]);
    await page.screenshot({ path: 'test-results/homepage-390x844.png', fullPage: true, animations: 'disabled' });
  });

  test('Research hub loads, language switch works, and commercial boundary is explicit', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/research/', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Vitavolt Research');
    await expect(page.locator('#research-to-products')).toBeVisible();
    await expect(page.locator('#research-to-products')).toContainText('ANNE AI');
    await page.locator('[data-lang-btn="tr"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('#bridge-title')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, 'Research page should not overflow horizontally on mobile').toBe(false);
    expect(errors, 'Research page should not emit uncaught JavaScript errors').toEqual([]);
    await page.screenshot({ path: 'test-results/research-390x844.png', fullPage: true, animations: 'disabled' });
  });

  test('Research and homepage key routes respond successfully', async ({ request }) => {
    for (const path of ['/', '/research/', '/services.html', '/research/anne-ai.html', '/research/acs-active-coating-system.html']) {
      const response = await request.get(path);
      expect(response.status(), path + ' should return a successful response').toBeLessThan(400);
    }
  });
});
