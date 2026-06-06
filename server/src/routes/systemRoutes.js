const express = require('express');
const router = express.Router();
const SystemStatus = require('../models/SystemStatus');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');
const TelegramService = require('../services/telegram');
const ProductMonitor = require('../services/monitor');
const MyntraScraper = require('../services/scraper');

const BRANDS_TO_TRACK = [
  'H&M', 'Levis', 'RARE RABBIT', 'U.S. Polo Assn.', 'Van Heusen',
  'Tommy Hilfiger', 'Calvin Klein', 'Allen Solly', 'Arrow', 'Louis Philippe',
  'Jack & Jones', 'Wrogn', 'Roadster', 'HRX by Hrithik Roshan', 'Puma', 'Adidas', 'Nike',
  'Flying Machine', 'Pepe Jeans', 'Celio'
];

// Health Check Endpoint
router.get('/health', async (req, res) => {
  try {
    const status = await SystemStatus.findOne({ key: 'main_status' });
    const totalProducts = await Product.countDocuments();
    const totalAlerts = await Alert.countDocuments();
    
    res.json({
      success: true,
      data: {
        lastCrawlStart: status?.lastCrawlStart,
        lastCrawlEnd: status?.lastCrawlEnd,
        lastCrawlSuccess: status?.lastCrawlSuccess,
        lastCrawlProductsCount: status?.lastCrawlProductsCount,
        lastCrawlNewProducts: status?.lastCrawlNewProducts,
        lastCrawlUpdatedProducts: status?.lastCrawlUpdatedProducts,
        lastTelegramAlertSent: status?.lastTelegramAlertSent,
        totalAlertsSent: status?.totalAlertsSent,
        totalProducts,
        totalAlertsInDb: totalAlerts,
        cronStatus: status?.cronActive ? 'Active' : 'Inactive',
        mongodbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        uptime: process.uptime(),
        lastError: status?.lastError
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ping endpoint to keep server alive and trigger cron if missed
router.get('/ping', async (req, res) => {
    try {
        const status = await SystemStatus.findOne({ key: 'main_status' });
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        let triggered = false;
        
        // Trigger if:
        // 1. No status exists
        // 2. Last crawl start is older than 30 mins AND it's not currently running (lastCrawlEnd >= lastCrawlStart)
        // 3. Last crawl failed and was more than 10 mins ago
        
        const isStale = !status?.lastCrawlStart || status.lastCrawlStart < thirtyMinutesAgo;
        const isNotRunning = !status || (status.lastCrawlEnd && status.lastCrawlEnd >= status.lastCrawlStart);
        const lastFailed = status && !status.lastCrawlSuccess;
        const failedTenMinsAgo = status?.lastCrawlEnd && status.lastCrawlEnd < new Date(now.getTime() - 10 * 60 * 1000);

        if (isStale && isNotRunning) {
            console.log('Manual crawl triggered via ping: Stale');
            runManualCrawl();
            triggered = true;
        } else if (lastFailed && failedTenMinsAgo && isNotRunning) {
            console.log('Manual crawl triggered via ping: Last Failed');
            runManualCrawl();
            triggered = true;
        }

        res.json({ 
            success: true, 
            message: 'Pong', 
            timestamp: now,
            manualCrawlTriggered: triggered 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

async function runManualCrawl() {
    const startTime = new Date();
    let status = await SystemStatus.findOne({ key: 'main_status' });
    if (!status) status = new SystemStatus({ key: 'main_status' });

    status.lastCrawlStart = startTime;
    await status.save();

    try {
      const data = await MyntraScraper.scrapeBrands(BRANDS_TO_TRACK, 30);
      const { newProducts, updatedProducts } = await ProductMonitor.processFetchedProducts(data);

      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = true;
      status.lastCrawlProductsCount = data.length;
      status.lastCrawlNewProducts = newProducts;
      status.lastCrawlUpdatedProducts = updatedProducts;
      status.lastError = null;
      await status.save();
    } catch (error) {
      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = false;
      status.lastError = error.message;
      await status.save();
    }
}

// Admin Diagnostics
router.get('/diagnostics', async (req, res) => {
    try {
        const brands = await Product.distinct('brand');
        const categories = await Product.distinct('category');
        const avgDealScore = await Product.aggregate([
            { $group: { _id: null, avgScore: { $avg: "$dealScore" } } }
        ]);

        res.json({
            brandsCount: brands.length,
            categoriesCount: categories.length,
            brands,
            categories,
            avgDealScore: avgDealScore[0]?.avgScore || 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Test Telegram Alert
router.post('/test-alert', async (req, res) => {
    try {
        const product = await Product.findOne({ dealScore: { $gte: 70 } }).sort({ lastUpdated: -1 });
        if (!product) {
            return res.status(404).json({ success: false, message: 'No high score product found to test alert' });
        }

        await TelegramService.sendDealAlert(product, product.dropPercentage || 0, product.dealScore, product.lastPrice || product.mrp, true);
        res.json({ success: true, message: 'Test alert sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
