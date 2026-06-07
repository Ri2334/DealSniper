const cron = require('node-cron');
const ProductMonitor = require('../services/monitor');
const MyntraScraper = require('../services/scraper');
const SystemStatus = require('../models/SystemStatus');

const BRANDS_TO_TRACK = [
  'H&M', 'Levis', 'RARE RABBIT', 'U.S. Polo Assn.', 'Van Heusen',
  'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe',
  'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike',
  'Flying Machine', 'Pepe Jeans', 'Celio'
];

const initCronJobs = () => {
  // Auto-reset stuck crawl on startup
  const resetStuckCrawl = async () => {
    try {
      await SystemStatus.findOneAndUpdate(
        { key: 'main_status' },
        { isCrawling: false, currentBrand: null },
        { upsert: true }
      );
      console.log('Stuck crawl state reset on startup.');
    } catch (e) {
      console.error('Failed to reset stuck crawl', e);
    }
  };

  const runJob = async () => {
    let status = await SystemStatus.findOne({ key: 'main_status' });
    if (!status) {
      status = new SystemStatus({ key: 'main_status' });
    }

    // If crawling for more than 30 mins, assume it's stuck and override
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (status.isCrawling && status.updatedAt < thirtyMinsAgo) {
        console.warn(`[${new Date().toISOString()}] Crawl appears stuck (started ${status.updatedAt}). Resetting.`);
        status.isCrawling = false;
    }

    if (status.isCrawling) {
        console.log(`[${new Date().toISOString()}] Crawl already in progress (${status.currentBrand}). Skipping.`);
        return;
    }

    console.log(`[${new Date().toISOString()}] Starting cron cycle...`);
    
    status.lastCrawlStart = new Date();
    status.isCrawling = true;
    status.brandsCompleted = [];
    status.lastCrawlProductsCount = 0;
    status.lastCrawlNewProducts = 0;
    status.lastCrawlUpdatedProducts = 0;
    await status.save();

    try {
      const results = {
        totalProducts: 0,
        totalNew: 0,
        totalUpdated: 0,
        failedBrands: []
      };

      for (const brand of BRANDS_TO_TRACK) {
        status.currentBrand = brand;
        await status.save();

        try {
            console.log(`[CRON] [${new Date().toISOString()}] Scraping: ${brand}`);
            const data = await MyntraScraper.scrapeProducts([brand], 10); // 10 pages per brand for faster cycles
            
            if (data.length > 0) {
                console.log(`[CRON] Processing ${data.length} products for ${brand}`);
                const { newProducts, updatedProducts } = await ProductMonitor.processFetchedProducts(data);
                
                results.totalProducts += data.length;
                results.totalNew += newProducts;
                results.totalUpdated += updatedProducts;
                status.brandsCompleted.push(brand);
                
                // Update progress in status
                status.lastCrawlEnd = new Date();
                status.lastCrawlProductsCount = results.totalProducts;
                status.lastCrawlNewProducts = results.totalNew;
                status.lastCrawlUpdatedProducts = results.totalUpdated;
            } else {
                console.warn(`[CRON] No products found for ${brand}`);
                results.failedBrands.push(brand);
            }
        } catch (brandError) {
            console.error(`[CRON] Failed to scrape ${brand}:`, brandError.message);
            results.failedBrands.push(brand);
        }
        
        await status.save();
      }

      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = results.failedBrands.length < BRANDS_TO_TRACK.length;
      status.lastCrawlProductsCount = results.totalProducts;
      status.lastCrawlNewProducts = results.totalNew;
      status.lastCrawlUpdatedProducts = results.totalUpdated;
      status.lastError = results.failedBrands.length > 0 ? `Failed brands: ${results.failedBrands.join(', ')}` : null;
      
      console.log(`[CRON] Cycle completed. Success: ${status.lastCrawlSuccess}, Items: ${results.totalProducts}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in cron job:`, error.message);
      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = false;
      status.lastError = error.message;
    } finally {
      status.isCrawling = false;
      status.currentBrand = null;
      await status.save();
    }
  };

  // Run every 30 minutes
  cron.schedule('*/30 * * * *', runJob);
  
  // Also run once on startup
  console.log('Initial cron job triggered on startup.');
  resetStuckCrawl().then(() => runJob());
};

module.exports = initCronJobs;


