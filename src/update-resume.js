const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { rootDir, statePath, resumePath, headless, browserChannel, requireResume, requireState } = require('./config');

const profileUrl = 'https://www.naukri.com/mnjuser/profile';
const uploadUrlPattern = /(resume|cv|upload)/i;

async function assertLoggedIn(page) {
  if (page.url().includes('nlogin') || await page.locator('a#login_Layer, a[title="Jobseeker Login"]').first().isVisible().catch(() => false)) {
    throw new Error('Saved Naukri login state has expired. Run npm run login again and replace state/naukri-storage-state.json on the server.');
  }
}

async function waitForUpload(page) {
  return Promise.race([
    page.waitForResponse(response => {
      const request = response.request();
      return uploadUrlPattern.test(response.url())
        && ['POST', 'PUT', 'PATCH'].includes(request.method())
        && response.status() >= 200
        && response.status() < 300;
    }, { timeout: 60000 }),
    page.getByText(/resume.*(updated|uploaded)|successfully.*resume/i).first().waitFor({ state: 'visible', timeout: 60000 }),
  ]);
}

async function main() {
  requireResume();
  requireState();
  const browser = await chromium.launch({ headless, channel: browserChannel });
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();

  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await assertLoggedIn(page);
    if (await page.getByText(/access denied/i).first().isVisible().catch(() => false)) {
      throw new Error('Naukri blocked this browser request. Use HEADLESS=false with npm run update:server so Chrome runs under Xvfb.');
    }

    const resumeInput = page.locator('input[type="file"]').first();
    if (!(await resumeInput.count())) {
      throw new Error('Naukri resume file input was not found. Run with HEADLESS=false to inspect the current profile page.');
    }

    const uploadComplete = waitForUpload(page);
    await resumeInput.setInputFiles(resumePath);
    await uploadComplete;
    console.log(`Resume upload completed: ${resumePath}`);
  } catch (error) {
    const dataDir = path.join(rootDir, 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    const screenshotPath = path.join(dataDir, `failure-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    console.error(`Resume update failed: ${error.message}`);
    console.error(`Diagnostic screenshot: ${screenshotPath}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(`Resume update failed: ${error.message}`);
  process.exitCode = 1;
});
