require('dotenv').config();
const mongoose = require('mongoose');
const MyntraScraper = require('./src/services/scraper');
const ProductMonitor = require('./src/services/monitor');

async function testMiniCrawl() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const brands = ['H&M'];
        console.log('Starting mini crawl for H&M (1 page)...');
        
        const data = await MyntraScraper.scrapeBrands(brands, 1);
        console.log(`Found ${data.length} products.`);
        
        if (data.length > 0) {
            console.log('Processing products...');
            const stats = await ProductMonitor.processFetchedProducts(data);
            console.log('Processing stats:', stats);
        }

        process.exit(0);
    } catch (error) {
        console.error('Mini crawl failed:', error);
        process.exit(1);
    }
}

testMiniCrawl();
