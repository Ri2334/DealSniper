const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyPlaywright() {
  console.log('--- [STARTUP_VERIFICATION] Checking Playwright ---');
  
  try {
    let exePath = chromium.executablePath();
    console.log(`Default executable path: ${exePath}`);
    
    if (!fs.existsSync(exePath)) {
      console.log('Default path not found, searching in /ms-playwright...');
      const baseDir = '/ms-playwright';
      if (fs.existsSync(baseDir)) {
        try {
          const revisions = fs.readdirSync(baseDir);
          for (const rev of revisions) {
            if (rev.startsWith('chromium-') || rev.startsWith('chromium_headless_shell-')) {
              const paths = [
                path.join(baseDir, rev, 'chrome-headless-shell-linux64/chrome-headless-shell'),
                path.join(baseDir, rev, 'chrome-linux/chrome'),
                path.join(baseDir, rev, 'chrome-headless-shell-linux/chrome-headless-shell')
              ];
              for (const p of paths) {
                if (fs.existsSync(p)) {
                  exePath = p;
                  break;
                }
              }
            }
            if (exePath !== chromium.executablePath()) break;
          }
        } catch (e) {
          console.warn(`[BROWSER_SEARCH_WARN] Could not read /ms-playwright: ${e.message}`);
        }
      }
    }

    console.log(`Using executable path: ${exePath}`);
    
    if (!fs.existsSync(exePath)) {
      console.error(`CRITICAL: Chromium executable not found at any known path.`);
      process.exit(1);
    }
    
    console.log('Attempting to launch browser...');
    const browser = await chromium.launch({
      executablePath: exePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const version = browser.version();
    console.log(`SUCCESS: Browser launched. Version: ${version}`);
    
    await browser.close();
    console.log('--- [STARTUP_VERIFICATION] Passed ---');
    process.exit(0);
  } catch (error) {
    console.error(`CRITICAL: Playwright verification failed: ${error.message}`);
    process.exit(1);
  }
}

verifyPlaywright();
