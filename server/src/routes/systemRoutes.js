const express = require('express');
const router = express.Router();
const SystemStatus = require('../models/SystemStatus');
const Product = require('../models/Product');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');
const TelegramService = require('../services/telegram');
const ProductMonitor = require('../services/monitor');
const MyntraScraper = require('../services/scraper');
const ProxyManager = require('../services/proxyManager');
const { chromium } = require('playwright');
const fs = require('fs');

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

// Detailed Scraper Health
router.get('/scraper-health', async (req, res) => {
    try {
        const status = await SystemStatus.findOne({ key: 'main_status' });
        
        // Check Browser Status
        const exePath = chromium.executablePath();
        const browserExists = fs.existsSync(exePath);
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            crawler: {
                isCrawling: status?.isCrawling,
                currentBrand: status?.currentBrand,
                lastCrawlEnd: status?.lastCrawlEnd,
                lastCrawlSuccess: status?.lastCrawlSuccess,
                brandsCompleted: status?.brandsCompleted?.length || 0,
                lastCrawlStats: {
                    items: status?.lastCrawlProductsCount,
                    new: status?.lastCrawlNewProducts,
                    updated: status?.lastCrawlUpdatedProducts
                }
            },
            playwright: {
                executablePath: exePath,
                existsOnDisk: browserExists,
                version: require('playwright/package.json').version
            },
            proxy: {
                mode: ProxyManager.getMode(),
                isEnabled: ProxyManager.isEnabled()
            },
            system: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                nodeVersion: process.version
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
        // If end is undefined but start was > 45 mins ago, assume it crashed
        const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60 * 1000);
        const isCrashed = status?.lastCrawlStart && !status.lastCrawlEnd && status.lastCrawlStart < fortyFiveMinsAgo;
        const isNotRunning = !status || (status.lastCrawlEnd && status.lastCrawlEnd >= status.lastCrawlStart) || isCrashed;
        
        const lastFailed = status && status.lastCrawlSuccess === false;
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
    let status = await SystemStatus.findOne({ key: 'main_status' });
    if (!status) status = new SystemStatus({ key: 'main_status' });

    if (status.isCrawling) return;

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
        
        const data = await MyntraScraper.scrapeProducts([brand], 10); // Even lighter for manual trigger
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
    } catch (error) {
      console.error('Manual crawl failed:', error.message);
      status.lastCrawlEnd = new Date();
      status.lastCrawlSuccess = false;
      status.isCrawling = false;
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
