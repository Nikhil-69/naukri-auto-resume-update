const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { statePath, browserChannel, browserExecutablePath } = require('./config');

async function isLoggedIn(page) {
  const loginLink = page.locator('a#login_Layer, a[title="Jobseeker Login"]').first();
  try {
    return !(await loginLink.isVisible({ timeout: 3000 }));
  } catch {
    return true;
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    ...(browserExecutablePath ? { executablePath: browserExecutablePath } : { channel: browserChannel }),
    slowMo: 50,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'domcontentloaded' });
    console.log('Complete the Naukri login in the browser. Waiting up to 5 minutes...');
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
      if (!page.url().includes('nlogin') && await isLoggedIn(page)) {
        fs.mkdirSync(path.dirname(statePath), { recursive: true });
        await context.storageState({ path: statePath });
        fs.chmodSync(statePath, 0o600);
        console.log(`Saved encrypted-session browser state to ${statePath}`);
        return;
      }
      await page.waitForTimeout(2000);
    }
    throw new Error('Login did not complete within 5 minutes.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(`Login setup failed: ${error.message}`);
  process.exitCode = 1;
});
