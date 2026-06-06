const { chromium } = require('playwright');
const fs = require('fs');

async function verifyPlaywright() {
  console.log('--- [STARTUP_VERIFICATION] Checking Playwright ---');
  
  try {
    const exePath = chromium.executablePath();
    console.log(`Expected executable path: ${exePath}`);
    
    if (!fs.existsSync(exePath)) {
      console.error(`CRITICAL: Chromium executable not found at ${exePath}`);
      process.exit(1);
    }
    
    console.log('Attempting to launch browser...');
    const browser = await chromium.launch({
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
