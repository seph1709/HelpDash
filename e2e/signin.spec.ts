import { test, expect } from '@playwright/test';

test('sign in with test credentials', async ({ page }) => {
  const networkLog: string[] = [];

  page.on('console', m => {
    if (m.type() === 'error') networkLog.push(`[console:error] ${m.text()}`);
  });
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('supabase') || url.includes('signout') || url.includes('login') || res.status() >= 300) {
      networkLog.push(`[${res.status()}] ${url.replace(/https:\/\/[^/]+/, '')}`);
    }
  });

  // Navigate to login
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  console.log('1. Loaded login:', page.url());

  // Fill form
  await page.locator('input[type="email"]').fill('test@mykuya.dev');
  await page.locator('input[type="password"]').fill('Test1234!');
  await page.screenshot({ path: 'e2e/step1-filled.png' });

  // Submit
  await page.locator('button[type="submit"]').click();
  console.log('2. Clicked submit, waiting for navigation...');

  // Wait up to 15s for URL to change away from /login
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('3. SUCCESS - redirected to:', page.url());
  } catch {
    console.log('3. TIMEOUT - still on:', page.url());
    // Grab visible page text for any error message
    const body = await page.locator('body').innerText();
    console.log('Page text:', body.slice(0, 300));
  }

  await page.screenshot({ path: 'e2e/step2-result.png' });

  console.log('\nNetwork log:');
  networkLog.forEach(l => console.log(' ', l));

  expect(page.url()).not.toContain('/login');
});
