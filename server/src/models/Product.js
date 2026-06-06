const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  brand: { type: String, required: true, index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  image: { type: String },
  mrp: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  lastPrice: { type: Number },
  dropPercentage: { type: Number, default: 0 },
  lastDropDate: { type: Date, index: true },
  highestPrice: { type: Number },
  lowestPrice: { type: Number },
  discountPercent: { type: Number, required: true, index: true },
  dealScore: { type: Number, default: 0, index: true },
  lastUpdated: { type: Date, default: Date.now, index: true },
  category: { type: String, index: true, default: 'Other' },
  gender: { type: String, index: true, default: 'Unisex' },
  ageGroup: { type: String, index: true, default: 'Adult' },
  sizes: [{ type: String }],
  availability: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
