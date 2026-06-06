const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runPlaywrightDiag() {
    const url = 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    console.log(`--- [PLAYWRIGHT_DIAG_START] ${new Date().toISOString()} ---`);
    console.log(`Target: ${url}`);

    let browser;
    try {
        browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        console.log('Navigating to Myntra...');
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        const title = await page.title();
        const finalUrl = page.url();
        const bodyText = await page.evaluate(() => document.body.innerText);
        const html = await page.content();
        
        console.log(`Status: ${response.status()}`);
        console.log(`Title: ${title}`);
        console.log(`Final URL: ${finalUrl}`);
        
        console.log('\n[BODY_TEXT_PREVIEW]');
        console.log(bodyText.substring(0, 1000).replace(/\s+/g, ' '));

        // Save screenshot
        const screenshotPath = path.join(__dirname, 'playwright-diag.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`\nScreenshot saved to: ${screenshotPath}`);

        // Block Detection
        let blockType = 'Unknown';
        const lowerHtml = html.toLowerCase();
        if (lowerHtml.includes('cloudflare')) blockType = 'Cloudflare';
        else if (lowerHtml.includes('akamai')) blockType = 'Akamai';
        else if (lowerHtml.includes('access denied')) blockType = 'Access Denied';
        else if (title === 'Site Maintenance') blockType = 'Site Maintenance (Title Match)';
        else if (bodyText.includes('Something went wrong')) blockType = 'Site Maintenance (Text Match)';
        
        console.log(`Detected Block: ${blockType}`);
        console.log(`--- [PLAYWRIGHT_DIAG_END] ---`);

    } catch (error) {
        console.error(`\n[PLAYWRIGHT_ERROR] ${error.message}`);
    } finally {
        if (browser) await browser.close();
        process.exit(0);
    }
}

runPlaywrightDiag();
