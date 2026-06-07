const axios = require('axios');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ProxyManager = require('./proxyManager');
const StealthUtils = require('../utils/stealth');

const ScraperAdapter = require('./scraperAdapter');

class MyntraScraper extends ScraperAdapter {
    constructor() {
        super('Myntra');
        this.strategies = ['GATEWAY_API', 'PLAYWRIGHT', 'HTML_SCRAPE'];
    }

    /**
     * Helper to find Playwright browser in Docker
     */
    findBrowserExecutable() {
        const baseDir = '/ms-playwright';
        if (!fs.existsSync(baseDir)) {
            // Fallback for Railway/Docker if PLAYWRIGHT_BROWSERS_PATH is set
            const envPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
            if (envPath && fs.existsSync(envPath)) {
                return this.searchInDirectory(envPath);
            }
            return undefined;
        }
        return this.searchInDirectory(baseDir);
    }

    searchInDirectory(dir) {
        try {
            const revisions = fs.readdirSync(dir);
            for (const rev of revisions) {
                if (rev.startsWith('chromium-') || rev.startsWith('chromium_headless_shell-')) {
                    const paths = [
                        path.join(dir, rev, 'chrome-headless-shell-linux64/chrome-headless-shell'),
                        path.join(dir, rev, 'chrome-linux/chrome'),
                        path.join(dir, rev, 'linux-1223/chrome-linux/chrome'), // Try versioned paths
                        path.join(dir, rev, 'chrome-headless-shell-linux/chrome-headless-shell')
                    ];
                    for (const p of paths) {
                        if (fs.existsSync(p)) return p;
                    }
                }
            }
        } catch (e) {
            console.error('[BROWSER_SEARCH_ERROR]', e.message);
        }
        return undefined;
    }

    /**
     * Main entry point for scraping brands
     */
    async scrapeProducts(brands = ['H&M'], maxPages = 5) {
        let allProducts = [];
        const startTime = Date.now();
        
        for (const brand of brands) {
            console.log(`[MYNTRA] Starting brand: ${brand}`);
            const brandProducts = await this.scrapeWithResilience(brand, maxPages);
            allProducts = [...allProducts, ...brandProducts];
        }

        console.log(`[MYNTRA_SUMMARY] Scraped ${allProducts.length} total products in ${(Date.now() - startTime) / 1000}s`);
        return allProducts;
    }

    async healthCheck() {
        try {
            const products = await this.scrapeViaGateway('H&M', 'h-m', 1);
            return { status: 'healthy', productsFound: products.length };
        } catch (e) {
            return { status: 'degraded', error: e.message };
        }
    }

    /**
     * Orchestrates multiple strategies for a single brand
     */
    async scrapeWithResilience(brand, maxPages) {
        const slug = this.generateSlug(brand);
        
        for (const strategy of this.strategies) {
            console.log(`[SCRAPER] [${brand}] Attempting strategy: ${strategy}`);
            
            let retries = 2;
            while (retries > 0) {
                try {
                    const strategyStartTime = Date.now();
                    let products = [];
                    
                    if (strategy === 'GATEWAY_API') {
                        products = await this.scrapeViaGateway(brand, slug, maxPages);
                    } else if (strategy === 'PLAYWRIGHT') {
                        products = await this.scrapeViaPlaywright(brand, slug, maxPages);
                    } else if (strategy === 'HTML_SCRAPE') {
                        products = await this.scrapeViaHtml(brand, slug, maxPages);
                    }

                    if (products && products.length > 0) {
                        console.log(`[SCRAPER_SUCCESS] [${brand}] Strategy ${strategy} found ${products.length} items in ${(Date.now() - strategyStartTime) / 1000}s`);
                        return products;
                    } else {
                        console.warn(`[SCRAPER_EMPTY] [${brand}] Strategy ${strategy} returned 0 items.`);
                        break; // Move to next strategy, don't retry if it explicitly returned 0
                    }
                } catch (error) {
                    retries--;
                    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
                    console.error(`[SCRAPER_FAIL] [${brand}] Strategy ${strategy} failed (Retries left: ${retries}): ${error.message} ${isTimeout ? '(TIMEOUT)' : ''}`);
                    
                    if (retries > 0) {
                        await StealthUtils.jitter(5000, 10000); // Wait longer before retry
                    }
                }
            }
        }

        console.error(`[SCRAPER_FATAL] [${brand}] All strategies exhausted.`);
        return [];
    }

    /**
     * LAYER 2: Gateway API
     */
    async scrapeViaGateway(brand, slug, maxPages) {
        let products = [];
        const axiosConfig = ProxyManager.getAxiosConfig() || {};
        
        for (let p = 1; p <= maxPages; p++) {
            const pageStartTime = Date.now();
            const url = `https://www.myntra.com/gateway/v2/search/${slug}?p=${p}&rows=50&f=Brand%3A${encodeURIComponent(brand)}&sort=new`;
            
            try {
                const response = await axios.get(url, {
                    ...axiosConfig,
                    headers: StealthUtils.getHeaders({
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': `https://www.myntra.com/${slug}`
                    }),
                    timeout: 25000 // Increased timeout for Railway
                });

                console.log(`[GATEWAY_RESPONSE] [${brand}] Page ${p} Status: ${response.status}`);
                
                // DEBUG: Log top-level keys
                const dataKeys = response.data ? Object.keys(response.data) : 'N/A';
                console.log(`[GATEWAY_DEBUG] [${brand}] Top-level keys: ${JSON.stringify(dataKeys)}`);

                const results = response.data?.searchData?.results?.products;
                if (results && results.length > 0) {
                    const formatted = this.formatProducts(results, brand);
                    products = [...products, ...formatted];
                    console.log(`[GATEWAY_EXTRACT] [${brand}] Page ${p}: Extracted ${formatted.length} items in ${(Date.now() - pageStartTime) / 1000}s`);
                    
                    if (!response.data.searchData.results.hasNextPage) break;
                } else {
                    console.warn(`[GATEWAY_NO_DATA] [${brand}] Page ${p}: searchData.results.products is empty or missing`);
                    // Extra debug for deeper structure
                    if (response.data?.searchData) {
                        console.log(`[GATEWAY_DEBUG] [${brand}] searchData keys: ${JSON.stringify(Object.keys(response.data.searchData))}`);
                        if (response.data.searchData.results) {
                             console.log(`[GATEWAY_DEBUG] [${brand}] searchData.results keys: ${JSON.stringify(Object.keys(response.data.searchData.results))}`);
                        }
                    }
                    break;
                }
                
                await StealthUtils.jitter(2000, 4000);
            } catch (error) {
                const status = error.response?.status;
                const htmlSnippet = error.response?.data ? String(error.response.data).substring(0, 500).replace(/\s+/g, ' ') : 'N/A';
                console.error(`[GATEWAY_ERROR] [${brand}] Page ${p} Status: ${status || 'TIMEOUT'}. Snippet: ${htmlSnippet}`);
                
                const block = StealthUtils.detectBlock(error.response?.data, status);
                if (block) throw new Error(`BLOCKED_BY_${block}`);
                throw error;
            }
        }
        return products;
    }

    /**
     * LAYER 3: Playwright Browser Automation
     */
    async scrapeViaPlaywright(brand, slug, maxPages) {
        let products = [];
        let browser;

        try {
            const proxy = ProxyManager.getPlaywrightConfig();
            
            // Explicitly look for the browser in the Docker image
            const exePath = this.findBrowserExecutable();
            
            console.log(`[PLAYWRIGHT_START] [${brand}] Launching browser... Path: ${exePath || 'DEFAULT'}, Proxy: ${proxy ? 'YES' : 'NO'}`);
            
            browser = await chromium.launch({
                headless: true,
                executablePath: exePath,
                proxy: proxy || undefined,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });

            const context = await browser.newContext({
                userAgent: StealthUtils.getUserAgent(),
                viewport: { width: 1280, height: 1000 }
            });

            const page = await context.newPage();
            
            for (let p = 1; p <= maxPages; p++) {
                const pageStartTime = Date.now();
                const url = `https://www.myntra.com/${slug}?f=Brand%3A${encodeURIComponent(brand)}&p=${p}&sort=new`;
                
                console.log(`[PLAYWRIGHT_NAV] [${brand}] Page ${p} -> ${url}`);
                await page.goto(url, { waitUntil: 'networkidle', timeout: 75000 });
                
                // Extract data from window.__myx
                const myxData = await page.evaluate(() => {
                    return window.__myx || window.__myx_data;
                });

                if (myxData?.searchData?.results?.products) {
                    const pageProducts = myxData.searchData.results.products;
                    const formatted = this.formatProducts(pageProducts, brand);
                    products = [...products, ...formatted];
                    console.log(`[PLAYWRIGHT_EXTRACT] [${brand}] Page ${p}: Found ${formatted.length} items in ${(Date.now() - pageStartTime) / 1000}s`);
                    
                    if (!myxData.searchData.results.hasNextPage) break;
                } else {
                    console.log(`[PLAYWRIGHT_FALLBACK] [${brand}] Page ${p}: __myx missing, attempting DOM scrape...`);
                    const domProducts = await this.scrapeDOM(page);
                    if (domProducts.length > 0) {
                        const formatted = this.formatProducts(domProducts, brand);
                        products = [...products, ...formatted];
                        console.log(`[PLAYWRIGHT_DOM_EXTRACT] [${brand}] Page ${p}: Found ${formatted.length} items`);
                    } else {
                        console.warn(`[PLAYWRIGHT_NO_DATA] [${brand}] Page ${p}: No products in __myx or DOM`);
                        break;
                    }
                }

                await StealthUtils.jitter(3000, 6000);
            }
        } catch (error) {
            console.error(`[PLAYWRIGHT_ERROR] [${brand}] ${error.message}`);
            throw error;
        } finally {
            if (browser) await browser.close();
        }

        return products;
    }

    /**
     * LAYER 4: Fallback HTML Scrape
     */
    async scrapeViaHtml(brand, slug, maxPages) {
        let products = [];
        const axiosConfig = ProxyManager.getAxiosConfig() || {};
        console.log(`[HTML_START] [${brand}] Starting fallback HTML scrape...`);

        for (let p = 1; p <= maxPages; p++) {
            const pageStartTime = Date.now();
            const url = `https://www.myntra.com/${slug}?f=Brand%3A${encodeURIComponent(brand)}&p=${p}&sort=new`;
            
            try {
                const response = await axios.get(url, {
                    ...axiosConfig,
                    headers: StealthUtils.getHeaders({
                        'Referer': 'https://www.google.com/'
                    }),
                    timeout: 30000
                });

                console.log(`[HTML_RESPONSE] [${brand}] Page ${p} Status: ${response.status}`);
                const html = response.data;
                
                // DEBUG: Search for script markers
                const markers = ['__myx', '__myx_data', 'searchData', 'results'];
                markers.forEach(m => {
                    const pos = html.indexOf(m);
                    if (pos !== -1) {
                        const snippet = html.substring(Math.max(0, pos - 100), Math.min(html.length, pos + 400)).replace(/\s+/g, ' ');
                        console.log(`[HTML_DEBUG] [${brand}] Found marker '${m}' at ${pos}. Snippet: ${snippet}`);
                    }
                });

                // More resilient regex to find __myx
                const match = html.match(/window\.__myx(_data)?\s*=\s*({.*?})[\s;]*<\/script>/) || 
                              html.match(/__myx(_data)?\s*=\s*({.*?})[\s;]*<\/script>/) ||
                              html.match(/<script>\s*window\.__myx\s*=\s*({.*?})\s*<\/script>/);
                
                if (match && (match[2] || match[1])) {
                    const jsonStr = match[2] || match[1];
                    const myx = JSON.parse(jsonStr);
                    const results = myx?.searchData?.results?.products;
                    if (results && results.length > 0) {
                        const formatted = this.formatProducts(results, brand);
                        products = [...products, ...formatted];
                        console.log(`[HTML_EXTRACT] [${brand}] Page ${p}: Extracted ${formatted.length} items in ${(Date.now() - pageStartTime) / 1000}s`);
                        
                        if (!myx.searchData.results.hasNextPage) break;
                    } else {
                        console.warn(`[HTML_NO_RESULTS] [${brand}] Page ${p}: __myx found but products array is empty`);
                        break;
                    }
                } else {
                    const block = StealthUtils.detectBlock(html, response.status);
                    console.warn(`[HTML_PARSE_FAIL] [${brand}] Page ${p}: Could not find __myx marker. Block detected: ${block || 'NONE'}`);
                    if (block) throw new Error(`BLOCKED_BY_${block}`);
                    break;
                }

                await StealthUtils.jitter(2000, 5000);
            } catch (error) {
                console.error(`[HTML_ERROR] [${brand}] Page ${p}: ${error.message}`);
                throw error;
            }
        }
        return products;
    }

    /**
     * Helpers
     */
    generateSlug(brand) {
        if (brand === 'RARE RABBIT') return 'rare-rabbit';
        if (brand === 'Levis') return 'levis';
        if (brand === 'U.S. Polo Assn.') return 'us-polo-assn';
        
        return brand.toLowerCase()
            .replace(/h&m/g, 'h-m')
            .replace(/&/g, '-')
            .replace(/\s+/g, '-')
            .replace(/\./g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    formatProducts(items, brand) {
        return items.map(item => {
            // Myntra availability logic - very aggressive to avoid "Out of Stock" showing up
            let isAvailable = true;
            
            // Check all known Myntra availability flags
            if (
                item.inventory === 0 || 
                item.outOfStock === true || 
                item.available === false || 
                item.inStock === false ||
                item.status === 'out_of_stock' ||
                (item.totalInventoryCount !== undefined && item.totalInventoryCount === 0)
            ) {
                isAvailable = false;
            }

            return {
                productId: String(item.productId),
                brand: item.brand || brand,
                name: item.productName || item.product || '',
                url: `https://www.myntra.com/${item.landingPageUrl}`,
                image: item.searchImage || '',
                mrp: item.mrp || 0,
                currentPrice: item.price || 0,
                discountPercent: item.mrp > 0 ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0,
                category: item.category || 'Fashion',
                availability: isAvailable,
                lastUpdated: new Date()
            };
        });
    }

    async scrapeDOM(page) {
        // Basic DOM selector for Myntra products if JSON fails
        return await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.product-base').forEach(el => {
                const link = el.querySelector('a')?.getAttribute('href');
                const id = link?.match(/\/(\d+)\/buy/)?.[1];
                if (id) {
                    items.push({
                        productId: id,
                        productName: el.querySelector('.product-product')?.innerText,
                        brand: el.querySelector('.product-brand')?.innerText,
                        landingPageUrl: link,
                        price: parseInt(el.querySelector('.product-discountedPrice')?.innerText.replace(/[^\d]/g, '')),
                        mrp: parseInt(el.querySelector('.product-strike')?.innerText.replace(/[^\d]/g, '')),
                    });
                }
            });
            return items;
        });
    }
}

module.exports = new MyntraScraper();
