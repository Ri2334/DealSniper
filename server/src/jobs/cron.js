const cron = require('node-cron');
const ProductMonitor = require('../services/monitor');
const MyntraScraper = require('../services/scraper');

const BRANDS_TO_TRACK = [
  'H&M', 'Levis', 'RARE RABBIT', 'U.S. Polo Assn.', 'Van Heusen',
  'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe',
  'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike',
  'Flying Machine', 'Pepe Jeans', 'Celio'
];

const initCronJobs = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running live product price monitor job...');
    try {
      const data = await MyntraScraper.scrapeBrands(BRANDS_TO_TRACK, 100); // Scrape up to 100 pages per brand (effectively 'all')
      console.log(`Successfully scraped ${data.length} products.`);
      await ProductMonitor.processFetchedProducts(data);
    } catch (error) {
      console.error('Error in cron job:', error.message);
    }
    console.log('Product monitor job completed.');
  });
};

module.exports = initCronJobs;

