import {expect, test} from '@playwright/test';

/**
 * Smoke e2e — the public surfaces only (no dashboard auth in CI):
 * health, the landing page in both locales/RTL/LTR, the demo public menu,
 * and the login page. The demo restaurant is provided by `pnpm seed`.
 */

test('health endpoint pings the database', async ({request}) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
});

test('landing renders in Arabic with RTL', async ({page}) => {
  await page.goto('/');
  // Default locale is Arabic and stays unprefixed (`as-needed` routing).
  await expect(page).toHaveURL('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveText('منيو مطعمك، على بُعد مسحة واحدة');
  // The landing page now carries the pricing plans section.
  await expect(page.locator('#pricing')).toBeVisible();
});

test('landing renders in English with LTR', async ({page}) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('h1')).toHaveText('Your menu, one scan away');
  await expect(page.locator('#pricing')).toBeVisible();
});

test('demo public menu renders in Arabic', async ({page}) => {
  await page.goto('/demo');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', {name: 'مطعم النيل'}).first()).toBeVisible();
});

test('demo public menu renders in English', async ({page}) => {
  await page.goto('/en/demo');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('heading', {name: 'Nile Restaurant'}).first()).toBeVisible();
  // Bilingual content: category headings follow the locale too.
  await expect(page.getByRole('heading', {name: 'Starters'}).first()).toBeVisible();
});

test('a dish can be added to the cart and reviewed in English', async ({page}) => {
  await page.goto('/en/demo');
  const firstAdd = page.getByRole('button', {name: 'Add'}).first();
  await firstAdd.click();
  await expect(page.getByText('Review order')).toBeVisible();
  await page.getByText('Review order').click();
  // The sheet shows the dish under its English name.
  await expect(page.getByRole('heading', {name: 'Confirm order'})).toBeVisible();
  await expect(page.getByText('×1').first()).toBeVisible();
});

test('a dish with sizes and add-ons is configured through the sheet', async ({page}) => {
  await page.goto('/en/demo');
  // The seeded Koshari carries option groups, so Add opens the sheet.
  await page.getByRole('button', {name: 'Add Egyptian Koshari'}).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  // Required groups the customer has not answered keep the button disabled.
  const addButton = sheet.getByRole('button', {name: /Add to cart|Complete the required options/});
  await expect(addButton).toBeDisabled();

  await sheet.getByText('Hot', {exact: true}).click();
  await sheet.getByText('Large', {exact: true}).click();
  await sheet.getByText('Extra sauce', {exact: true}).click();

  // Base 50 + large 15 + sauce 10 = EGP 75, shown on the add button.
  await expect(addButton).toContainText('EGP\u00A075');
  await addButton.click();

  // The configured line lands in the cart with its selection summary.
  await page.getByText('Review order').click();
  await expect(page.getByRole('heading', {name: 'Confirm order'})).toBeVisible();
  await expect(
    page.getByText('Size: Large (EGP\u00A015) · Spice level: Hot · Add-ons: Extra sauce (EGP\u00A010)')
  ).toBeVisible();
});

test('login page renders', async ({page}) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
