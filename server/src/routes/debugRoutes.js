const express = require('express');
const router = express.Router();
const axios = require('axios');
const { chromium } = require('playwright');

router.get('/myntra', async (req, res) => {
    const targetUrl = req.query.url || 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    const results = {
        timestamp: new Date().toISOString(),
        targetUrl,
        steps: []
    };

    try {
        // Step 1: Homepage Handshake
        results.steps.push({ name: 'Home Handshake' });
        const homeRes = await axios.get('https://www.myntra.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
            },
            timeout: 10000,
            validateStatus: false
        });
        
        const cookies = homeRes.headers['set-cookie'] || [];
        const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
        
        results.steps[0].status = homeRes.status;
        results.steps[0].cookieCount = cookies.length;
        results.steps[0].title = String(homeRes.data).match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';

        // Step 2: Target Fetch
        results.steps.push({ name: 'Target Fetch', url: targetUrl });
        const targetRes = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8',
                'Cookie': cookieHeader,
                'Referer': 'https://www.myntra.com/'
            },
            timeout: 15000,
            validateStatus: false,
            maxRedirects: 5
        });

        const data = targetRes.data;
        results.steps[1].status = targetRes.status;
        results.steps[1].finalUrl = targetRes.request.res.responseUrl || targetUrl;
        results.steps[1].contentType = targetRes.headers['content-type'];
        results.steps[1].headers = targetRes.headers;
        results.steps[1].title = String(data).match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';
        results.steps[1].bodySnippet = typeof data === 'string' ? data.substring(0, 3000).replace(/\s+/g, ' ') : 'Not a string';
        
        // Block Detection
        let blockType = 'Unknown';
        const bodyStr = String(data).toLowerCase();
        if (bodyStr.includes('cloudflare')) blockType = 'Cloudflare';
        else if (bodyStr.includes('akamai')) blockType = 'Akamai';
        else if (bodyStr.includes('access denied')) blockType = 'Access Denied';
        else if (bodyStr.includes('captcha')) blockType = 'Captcha';
        else if (bodyStr.includes('maintenance')) blockType = 'Site Maintenance';
        else if (results.steps[1].title === 'Site Maintenance') blockType = 'Site Maintenance (Title Match)';
        
        results.blockType = blockType;

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: error.stack,
            results 
        });
    }
});

router.get('/playwright', async (req, res) => {
    const targetUrl = req.query.url || 'https://www.myntra.com/h-m?f=Brand%3AH%26M';
    const results = {
        timestamp: new Date().toISOString(),
        targetUrl,
        env: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        },
        browserInfo: {}
    };

    let browser;
    try {
        console.log(`[PLAYWRIGHT_DEBUG] Attempting to launch chromium for ${targetUrl}`);
        browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
            extraHTTPHeaders: {
                'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8'
            }
        });
        
        const page = await context.newPage();
        console.log(`[PLAYWRIGHT_DEBUG] Navigating to ${targetUrl}...`);
        
        const response = await page.goto(targetUrl, { 
            waitUntil: 'networkidle', 
            timeout: 60000 // Increased timeout for slow Render instances
        });

        const title = await page.title();
        const content = await page.content();
        const bodyText = await page.evaluate(() => document.body.innerText);

        results.browserInfo = {
            status: response.status(),
            title: title,
            finalUrl: page.url(),
            bodyTextPreview: bodyText.substring(0, 2000).replace(/\s+/g, ' ')
        };

        let blockType = 'None Detected';
        const lowerHtml = content.toLowerCase();
        if (lowerHtml.includes('cloudflare')) blockType = 'Cloudflare';
        else if (lowerHtml.includes('akamai')) blockType = 'Akamai';
        else if (title === 'Site Maintenance' || bodyText.includes('Something went wrong')) blockType = 'Site Maintenance';
        else if (lowerHtml.includes('access denied')) blockType = 'Access Denied';
        
        results.blockType = blockType;
        results.success = !blockType.includes('Site Maintenance') && !blockType.includes('Denied');

        res.json({ success: true, results });
    } catch (error) {
        console.error(`[PLAYWRIGHT_ERROR] ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            tip: error.message.includes('executable') ? 'Chromium binary missing. Ensure "npx playwright install chromium" ran during build.' : 'Check Render logs for dependency errors.',
            results 
        });
    } finally {
        if (browser) await browser.close();
    }
});

router.get('/playwright-status', async (req, res) => {
    const results = {
        timestamp: new Date().toISOString(),
        env: {
            PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH,
            HOME: process.env.HOME,
            PWD: process.env.PWD
        },
        playwrightVersion: require('playwright/package.json').version,
        executablePath: chromium.executablePath(),
        existsOnDisk: false,
        launchSucceeds: false,
        lsCache: [],
        lsLocal: [],
        error: null
    };

    try {
        const fs = require('fs');
        results.existsOnDisk = fs.existsSync(results.executablePath);
        
        // Manual scan of common locations
        const cachePath = '/opt/render/.cache/ms-playwright';
        if (fs.existsSync(cachePath)) {
            results.lsCache = fs.readdirSync(cachePath);
        }

        const localPath = path.join(__dirname, '../../node_modules/playwright-core/.local-browsers');
        if (fs.existsSync(localPath)) {
            results.lsLocal = fs.readdirSync(localPath);
        }

        const browser = await chromium.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        results.launchSucceeds = true;
        await browser.close();
    } catch (error) {
        results.error = error.message;
    }

    res.json({ success: true, results });
});

module.exports = router;
