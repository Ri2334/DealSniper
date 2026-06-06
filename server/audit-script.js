require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const SystemStatus = require('./src/models/SystemStatus');
const Alert = require('./src/models/Alert');

async function runAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const status = await SystemStatus.findOne({ key: 'main_status' });
    console.log('--- SYSTEM STATUS ---');
    if (status) {
        console.log(`Last Crawl Start: ${status.lastCrawlStart}`);
        console.log(`Last Crawl End:   ${status.lastCrawlEnd}`);
        console.log(`Success:          ${status.lastCrawlSuccess}`);
        console.log(`Products Found:   ${status.lastCrawlProductsCount}`);
        console.log(`New Products:     ${status.lastCrawlNewProducts}`);
        console.log(`Updated Products: ${status.lastCrawlUpdatedProducts}`);
        console.log(`Last Error:       ${status.lastError || 'None'}`);
        console.log(`Is Crawling:      ${status.isCrawling}`);
        console.log(`Current Brand:    ${status.currentBrand || 'N/A'}`);
        console.log(`Brands Done:      ${status.brandsCompleted?.length || 0} / 20`);
        console.log(`Telegram Alerts:  ${status.totalAlertsSent}`);
    } else {
        console.log('No system status found.');
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const updatedCount = await Product.countDocuments({ lastUpdated: { $gte: fiveMinsAgo } });
    console.log(`Products Updated (Last 5 Mins): ${updatedCount}`);
    const hotDeals70 = await Product.countDocuments({ dealScore: { $gte: 70 } });
    const hotDeals80 = await Product.countDocuments({ dealScore: { $gte: 80 } });
    
    // Simulate Alert Logic
    // Logic: isDeal && (score >= 80 || dropPercent >= 30 || isTrueLowest)
    // where isDeal = discountPercent >= 75 || currentPrice <= 500 || dropPercent >= 20
    
    const allProducts = await Product.find({});
    let alertQualifyCount = 0;
    let qualifyingProducts = [];
    
    for (const p of allProducts) {
        const isDeal = p.discountPercent >= 75 || p.currentPrice <= 500 || (p.dropPercentage || 0) >= 20;
        const isTrueLowest = p.currentPrice <= (p.lowestPrice || p.currentPrice) && (p.lastPrice !== undefined && p.currentPrice < p.lastPrice);
        
        if (isDeal && (p.dealScore >= 80 || (p.dropPercentage || 0) >= 30 || isTrueLowest)) {
            alertQualifyCount++;
            qualifyingProducts.push({
                name: p.name,
                brand: p.brand,
                currentPrice: p.currentPrice,
                dealScore: p.dealScore,
                dropPercentage: p.dropPercentage,
                isDeal
            });
        }
    }
    
    // ...
    console.log(`Satisfy Alert Logic: ${alertQualifyCount}`);
    console.log('Qualifying Products:', JSON.stringify(qualifyingProducts, null, 2));

    const topProducts = await Product.find({}).sort({ dealScore: -1 }).limit(5);
    console.log('Top 5 Deal Scores:', topProducts.map(p => ({ name: p.name, score: p.dealScore, discount: p.discountPercent, drop: p.dropPercentage })));
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

runAudit();
