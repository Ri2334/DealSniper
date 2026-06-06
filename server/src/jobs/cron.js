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
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Starting cron cycle...`);
    
    const startTime = new Date();
    let status = await SystemStatus.findOne({ key: 'main_status' });
    if (!status) {
      status = new SystemStatus({ key: 'main_status' });
    }

    status.lastCrawlStart = startTime;
    await status.save();

    try {
      console.log(`[${new Date().toISOString()}] Scraper started for ${BRANDS_TO_TRACK.length} brands...`);
      const data = await MyntraScraper.scrapeBrands(BRANDS_TO_TRACK, 50); // Reduced pages slightly for reliability
      console.log(`[${new Date().toISOString()}] Scraper finished. Found ${data.length} products.`);
      
      console.log(`[${new Date().toISOString()}] Processing products...`);
      const { newProducts, updatedProducts } = await ProductMonitor.processFetchedProducts(data);
      console.log(`[${new Date().toISOString()}] Processing finished. New: ${newProducts}, Updated: ${updatedProducts}`);

      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = true;
      status.lastCrawlProductsCount = data.length;
      status.lastCrawlNewProducts = newProducts;
      status.lastCrawlUpdatedProducts = updatedProducts;
      status.lastError = null;
      await status.save();
      
      console.log(`[${new Date().toISOString()}] Cron cycle completed successfully.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in cron job:`, error.message);
      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = false;
      status.lastError = error.message;
      await status.save();
    }
  });
};

module.exports = initCronJobs;


