const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const Alert = require('../models/Alert');
const DealEngine = require('./dealEngine');
const TelegramService = require('./telegram');

class ProductMonitor {
  static categorize(name, url, category = '') {
    const text = `${name} ${url} ${category}`.toLowerCase();
    if (text.includes('shirt') && !text.includes('t-shirt') && !text.includes('tshirt')) return 'Shirts';
    if (text.includes('t-shirt') || text.includes('tshirt') || text.includes('tee')) return 'T-Shirts';
    if (text.includes('jeans')) return 'Jeans';
    if (text.includes('trouser') || text.includes('chino') || text.includes('pant') || text.includes('short')) return 'Trousers';
    if (text.includes('jacket') || text.includes('coat')) return 'Jackets';
    if (text.includes('sweatshirt') || text.includes('hoodie') || text.includes('sweater') || text.includes('pullover')) return 'Sweatshirts';
    if (text.includes('shoe') || text.includes('sneaker') || text.includes('footwear') || text.includes('boot') || text.includes('flip flop') || text.includes('sandal')) return 'Shoes';
    if (text.includes('belt') || text.includes('wallet') || text.includes('watch') || text.includes('bag') || text.includes('backpack') || text.includes('sock') || text.includes('cap') || text.includes('hat') || text.includes('sunglass')) return 'Accessories';
    return 'Other';
  }

  static categorizeGenderAndAge(name, url) {
    const text = `${name} ${url}`.toLowerCase();
    let gender = 'Unisex';
    let ageGroup = 'Adult';

    if (text.includes('boy')) { gender = 'Boys'; ageGroup = 'Kids'; }
    else if (text.includes('girl')) { gender = 'Girls'; ageGroup = 'Kids'; }
    else if (text.includes('kid') || text.includes('infant') || text.includes('toddler')) { ageGroup = 'Kids'; }
    else if (text.includes('women') || text.includes('woman')) { gender = 'Women'; }
    else if (text.includes('men') || text.includes('man')) { gender = 'Men'; }

    return { gender, ageGroup };
  }

  static async processFetchedProducts(scrapedProducts) {
    let newProducts = 0;
    let updatedProducts = 0;

    for (const item of scrapedProducts) {
      try {
        let product = await Product.findOne({ productId: item.productId });
        let previousPrice = null;

        // Auto-categorize
        item.category = this.categorize(item.name, item.url, item.category);
        const demoInfo = this.categorizeGenderAndAge(item.name, item.url);
        item.gender = demoInfo.gender;
        item.ageGroup = demoInfo.ageGroup;

        // Brand Normalization
        if (item.brand === 'Levis') item.brand = "Levi's";
        if (item.brand === 'RARE RABBIT') item.brand = 'Rare Rabbit';

        if (!product) {
          // New product
          newProducts++;
          item.lowestPrice = item.currentPrice;
          item.highestPrice = item.currentPrice;
          
          // Initial Deal Evaluation for new products (Drop % is 0)
          const { score } = DealEngine.evaluateDeal(item, null);
          item.dealScore = score;
          
          product = await Product.create(item);
          await PriceHistory.create({ productId: product.productId, price: product.currentPrice });
        } else {
          previousPrice = product.currentPrice;
          
          let hasChanged = false;
          if (product.currentPrice !== item.currentPrice || product.discountPercent !== item.discountPercent) {
            updatedProducts++;
            // Calculate True Price Drop
            if (product.currentPrice > item.currentPrice) {
               const drop = ((product.currentPrice - item.currentPrice) / product.currentPrice) * 100;
               product.lastPrice = product.currentPrice;
               product.dropPercentage = Math.round(drop);
               product.lastDropDate = new Date();
            } else if (product.currentPrice < item.currentPrice) {
               product.lastPrice = product.currentPrice;
               product.dropPercentage = 0;
            }

            product.currentPrice = item.currentPrice;
            product.discountPercent = item.discountPercent;
            hasChanged = true;
          }

          if (!product.lowestPrice || product.currentPrice < product.lowestPrice) {
            product.lowestPrice = product.currentPrice;
            hasChanged = true;
          }

          if (!product.highestPrice || product.currentPrice > product.highestPrice) {
            product.highestPrice = product.currentPrice;
            hasChanged = true;
          }

          // Recalculate Deal Score
          const { score } = DealEngine.evaluateDeal(product, previousPrice);
          product.dealScore = score;
          product.category = item.category; // Update category if it improved

          // Update existing product if price or discount changed
          if (hasChanged || product.isModified('dealScore')) {
            product.lastUpdated = Date.now();
            await product.save();

            if (hasChanged) {
              await PriceHistory.create({ productId: product.productId, price: product.currentPrice });
            }
          }
        }

        // Evaluate deal for alerting
        const { isDeal, dropPercent, score, isLowestPrice } = DealEngine.evaluateDeal(product, previousPrice);

        // Update product with new intelligence metrics
        product.dealScore = score;
        if (product.isModified()) {
             await product.save();
        }

        // Telegram alert rule: Significant Score or Big Drop or True Lowest Ever
        const isTrueLowest = isLowestPrice && previousPrice !== null && product.currentPrice < product.lowestPrice;
        
        if (isDeal && (score >= 80 || dropPercent >= 30 || isTrueLowest)) {
          const existingAlert = await Alert.findOne({ productId: product.productId }).sort({ sentAt: -1 });

          let shouldAlert = false;
          if (!existingAlert) {
            shouldAlert = true;
          } else {
            // Prevent spam: resend if price dropped further by at least 5% OR score improved significantly (+10)
            const priceDroppedFurther = product.currentPrice < existingAlert.priceAtAlert * 0.95;
            const scoreImproved = score >= (existingAlert.score || 0) + 10;
            
            if (priceDroppedFurther || scoreImproved) {
               shouldAlert = true;
            }
          }

          if (shouldAlert) {
            await TelegramService.sendDealAlert(product, dropPercent, score, previousPrice, isLowestPrice);
            await Alert.create({
              productId: product.productId,
              priceAtAlert: product.currentPrice,
              discountAtAlert: product.discountPercent,
              score
            });
          }
        }
      } catch (err) {
        console.error(`Error processing product ${item.productId}:`, err.message);
      }
    }

    return { newProducts, updatedProducts };
  }
}

module.exports = ProductMonitor;
