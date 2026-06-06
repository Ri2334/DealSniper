const mongoose = require('mongoose');

const SystemStatusSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'main_status'
  },
  lastCrawlStart: Date,
  lastCrawlEnd: Date,
  lastCrawlSuccess: Boolean,
  lastCrawlProductsCount: Number,
  lastCrawlNewProducts: Number,
  lastCrawlUpdatedProducts: Number,
  lastTelegramAlertSent: Date,
  totalAlertsSent: {
    type: Number,
    default: 0
  },
  lastError: String,
  cronActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemStatus', SystemStatusSchema);
