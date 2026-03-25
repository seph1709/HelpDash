const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: null });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on("console", msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on("response", res => {
    if (res.status() >= 300) logs.push(`[${res.status()}] ${res.url()}`);
  });

  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 15000 });
  console.log("URL:", page.url());

  await page.fill("input[type=email]", "test@mykuya.dev");
  await page.fill("input[type=password]", "Test1234!");
  await page.click("button[type=submit]");

  try {
    await page.waitForURL(url => !url.includes("/login"), { timeout: 8000 });
    console.log("SUCCESS:", page.url());
  } catch {
    console.log("FAILED on:", page.url());
    const txt = await page.evaluate(() => document.body.innerText);
    console.log("Body:", txt.slice(0, 400));
  }

  await page.screenshot({ path: "test-after-signin.png", fullPage: false });
  logs.forEach(l => console.log(l));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
