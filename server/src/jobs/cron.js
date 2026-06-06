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
  const runJob = async () => {
    let status = await SystemStatus.findOne({ key: 'main_status' });
    if (!status) {
      status = new SystemStatus({ key: 'main_status' });
    }

    if (status.isCrawling) {
        console.log(`[${new Date().toISOString()}] Crawl already in progress. Skipping.`);
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
      for (const brand of BRANDS_TO_TRACK) {
        status.currentBrand = brand;
        await status.save();

        console.log(`[${new Date().toISOString()}] Scraping brand: ${brand}`);
        const data = await MyntraScraper.scrapeBrands([brand], 20); // 20 pages per brand
        
        console.log(`[${new Date().toISOString()}] Processing ${data.length} products for ${brand}`);
        const { newProducts, updatedProducts } = await ProductMonitor.processFetchedProducts(data);
        
        status.lastCrawlProductsCount += data.length;
        status.lastCrawlNewProducts += newProducts;
        status.lastCrawlUpdatedProducts += updatedProducts;
        status.brandsCompleted.push(brand);
        await status.save();
      }

      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = true;
      status.isCrawling = false;
      status.currentBrand = null;
      status.lastError = null;
      await status.save();
      
      console.log(`[${new Date().toISOString()}] Cron cycle completed successfully.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in cron job:`, error.message);
      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = false;
      status.isCrawling = false;
      status.lastError = error.message;
      await status.save();
    }
  };

  // Run every 30 minutes
  cron.schedule('*/30 * * * *', runJob);
  
  // Also run once on startup
  console.log('Initial cron job triggered on startup.');
  runJob();
};

module.exports = initCronJobs;


