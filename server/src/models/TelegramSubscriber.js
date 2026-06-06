const mongoose = require('mongoose');

const telegramSubscriberSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true, index: true },
  firstName: String,
  username: String,
  categories: [{ type: String }],
  brands: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TelegramSubscriber', telegramSubscriberSchema);
