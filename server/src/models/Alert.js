const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  priceAtAlert: { type: Number, required: true },
  discountAtAlert: { type: Number, required: true },
  score: { type: Number },
  sentAt: { type: Date, default: Date.now },
  platform: { type: String, default: 'Telegram' }
});

const Alert = mongoose.model('Alert', alertSchema);
module.exports = Alert;
