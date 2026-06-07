const Product = require('../models/Product');
const PriceHistory = require('../models/PriceHistory');
const Alert = require('../models/Alert');
const DealEngine = require('./dealEngine');
const TelegramService = require('./telegram');

class ProductMonitor {
  static categorize(name, url, category = '') {
    const text = `${name} ${url} ${category}`.toLowerCase();
    
    // Level 1: Most Specific (Accessories & Special Items)
    if (text.includes('watch')) return 'Watches';
    if (text.includes('perfume') || text.includes('fragrance') || text.includes('deodorant')) return 'Fragrance';
    if (text.includes('sunglass')) return 'Sunglasses';
    if (text.includes('wallet') || text.includes('card holder')) return 'Wallets';
    if (text.includes('belt')) return 'Belts';
    if (text.includes('bag') || text.includes('backpack') || text.includes('handbag') || text.includes('clutch')) return 'Bags';
    
    // Level 2: Footwear
    if (text.includes('sneaker')) return 'Sneakers';
    if (text.includes('boot')) return 'Boots';
    if (text.includes('flip flop') || text.includes('sandal') || text.includes('loafer')) return 'Casual Shoes';
    if (text.includes('shoe') || text.includes('footwear')) return 'Shoes';
    
    // Level 3: Ethnic & Formal
    if (text.includes('kurta') || text.includes('kurti') || text.includes('sherwani') || text.includes('ethnic')) return 'Ethnic Wear';
    if (text.includes('blazer') || text.includes('waistcoat') || text.includes('suit') || text.includes('formal shirt')) return 'Formal Wear';
    
    // Level 4: Upper Wear (Highly Specific)
    if (text.includes('hoodie')) return 'Hoodies';
    if (text.includes('sweatshirt')) return 'Sweatshirts';
    if (text.includes('polo')) return 'Polo T-Shirts';
    if (text.includes('t-shirt') || text.includes('tshirt') || text.includes('tee')) return 'T-Shirts';
    if (text.includes('shirt')) return 'Shirts';
    
    // Level 5: Lower Wear
    if (text.includes('jeans') || text.includes('denim')) return 'Jeans';
    if (text.includes('cargo')) return 'Cargo Trousers';
    if (text.includes('short')) return 'Shorts';
    if (text.includes('trouser') || text.includes('chino') || text.includes('pant') || text.includes('jogger')) return 'Trousers';
    
    // Level 6: Outerwear
    if (text.includes('jacket') || text.includes('coat') || text.includes('parka') || text.includes('bomber')) return 'Jackets';
    if (text.includes('sweater') || text.includes('pullover') || text.includes('cardigan')) return 'Sweaters';
    
    // Level 7: Misc
    if (text.includes('brief') || text.includes('trunk') || text.includes('boxer') || text.includes('vest') || text.includes('innerwear')) return 'Innerwear';
    if (text.includes('sock')) return 'Socks';
    if (text.includes('active') || text.includes('track') || text.includes('gym') || text.includes('training')) return 'Activewear';
    
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
    const startTime = Date.now();

    console.log(`[MONITOR_START] Processing ${scrapedProducts.length} items...`);

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
          item.lowestPrice = item.currentPrice;
          item.highestPrice = item.currentPrice;
          
          // Initial Deal Evaluation for new products (Drop % is 0)
          const { score } = DealEngine.evaluateDeal(item, null);
          item.dealScore = score;
          
          product = await Product.create(item);
          await PriceHistory.create({ productId: product.productId, price: product.currentPrice });
          
          newProducts++;
          console.log(`[DB_CREATE] [${item.brand}] New product: ${item.productId} (₹${item.currentPrice})`);
        } else {
          previousPrice = product.currentPrice;
          
          let hasChanged = false;
          let changeType = '';

          // Update availability
          if (product.availability !== item.availability) {
            product.availability = item.availability;
            hasChanged = true;
          }

          if (product.currentPrice !== item.currentPrice || product.discountPercent !== item.discountPercent) {
            // Calculate True Price Drop
            if (product.currentPrice > item.currentPrice) {
               const drop = ((product.currentPrice - item.currentPrice) / product.currentPrice) * 100;
               product.lastPrice = product.currentPrice;
               product.dropPercentage = Math.round(drop);
               product.lastDropDate = new Date();
               changeType = 'PRICE_DROP';
            } else if (product.currentPrice < item.currentPrice) {
               product.lastPrice = product.currentPrice;
               product.dropPercentage = 0;
               changeType = 'PRICE_INCREASE';
            } else {
               changeType = 'DISCOUNT_CHANGE';
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

          // ALWAYS update lastUpdated to signal "Last Seen"
          product.lastUpdated = new Date();
          
          // Force Mongoose to recognize a change even if values look identical
          product.markModified('lastUpdated');

          await product.save();
          console.log(`[DB_SAVE_SUCCESS] [${item.brand}] ${item.productId} persisted.`);

          if (hasChanged) {
            await PriceHistory.create({ productId: product.productId, price: product.currentPrice });
            updatedProducts++;
            console.log(`[DB_UPDATE] [${item.brand}] ${item.productId}: ${changeType} (₹${previousPrice} -> ₹${item.currentPrice})`);
          } else {
            console.log(`[DB_SEEN] [${item.brand}] ${item.productId}: Still ₹${item.currentPrice}. Deal Score: ${score}`);
          }
        }

        // Evaluate deal for alerting
        const { isDeal, dropPercent, score, isLowestPrice } = DealEngine.evaluateDeal(product, previousPrice);

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
            console.log(`[ALERT_TRIGGER] [${product.brand}] ${product.productId} Score: ${score}, Drop: ${dropPercent}%`);
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
        console.error(`[MONITOR_ERROR] [${item.productId}] ${err.message}`);
      }
    }

    console.log(`[MONITOR_FINISH] Processed ${scrapedProducts.length} items in ${(Date.now() - startTime) / 1000}s. New: ${newProducts}, Updated: ${updatedProducts}`);
    return { newProducts, updatedProducts };
  }
}

module.exports = ProductMonitor;
