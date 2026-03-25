import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const logs = [];
page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`));
page.on('response', res => {
  if (res.status() >= 300) logs.push(`[${res.status()}] ${res.url()}`);
});

console.log('--- Navigating to /login ---');
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
console.log('URL after load:', page.url());
await page.screenshot({ path: 'test-1-login.png' });

console.log('--- Filling credentials ---');
await page.fill('input[type="email"]', 'test@mykuya.dev');
await page.fill('input[type="password"]', 'Test1234!');
await page.screenshot({ path: 'test-2-filled.png' });

console.log('--- Clicking Sign in ---');
await page.click('button[type="submit"]');

try {
  await page.waitForURL(url => !url.includes('/login'), { timeout: 8000 });
  console.log('SUCCESS - Redirected to:', page.url());
} catch {
  console.log('FAILED - Still on:', page.url());
  // Grab any error toast or visible error text
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page text:', bodyText.slice(0, 500));
}

await page.screenshot({ path: 'test-3-after.png' });

console.log('\n--- Network / Console Logs ---');
logs.forEach(l => console.log(l));

await browser.close();
