const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
module.exports = PriceHistory;
