class DealEngine {
  /**
   * Evaluates if the current product state qualifies as a deal.
   * Uses weighted scoring for Deal Intelligence.
   */
  static evaluateDeal(product, previousPrice = null) {
    const minDiscount = Number(process.env.DEAL_MIN_DISCOUNT_PERCENT) || 75;
    const maxPrice = Number(process.env.DEAL_MAX_PRICE) || 500;
    const minDrop = Number(process.env.DEAL_MIN_DROP_PERCENT) || 30;

    let isDeal = false;
    let dropPercent = product.dropPercentage || 0;

    if (previousPrice && previousPrice > product.currentPrice) {
      dropPercent = Math.round(((previousPrice - product.currentPrice) / previousPrice) * 100);
    }

    if (
      product.discountPercent >= minDiscount ||
      product.currentPrice <= maxPrice ||
      dropPercent >= 20 
    ) {
      isDeal = true;
    }

    const isLowestPrice = product.currentPrice <= (product.lowestPrice || product.currentPrice);
    
    // Historical Metrics Calculation
    const highestPrice = product.highestPrice || product.mrp || product.currentPrice;
    const lowestPrice = product.lowestPrice || product.currentPrice;
    
    // Trend Score: How close is it to lowest vs highest (0-100)
    let trendScore = 100;
    if (highestPrice > lowestPrice) {
      trendScore = Math.round(((highestPrice - product.currentPrice) / (highestPrice - lowestPrice)) * 100);
    }
    
    // Price Stability: If lowest is very close to current, it's more stable as a "good" price
    // We treat "dropPercent" as a negative indicator of stability (high volatility). 
    // High stability + low price = confident deal.
    const priceStabilityScore = Math.max(0, 100 - (dropPercent * 1.5));
    
    // Deal Confidence Score
    const confidenceScore = Math.round((trendScore * 0.5) + (priceStabilityScore * 0.5));

    const score = this.calculateDealScore(product, dropPercent, isLowestPrice, confidenceScore);

    return {
      isDeal,
      dropPercent,
      score,
      isLowestPrice,
      confidenceScore,
      trendScore
    };
  }

  static calculateDealScore(product, dropPercent, isLowestPrice, confidenceScore) {
    // Advanced Deal Score Formula
    // 0.4 × Price Drop % + 0.2 × Discount % + 0.2 × Lowest Price Bonus + 0.2 x Confidence Score
    const dropWeight = 0.4;
    const discountWeight = 0.2;
    const lowestBonusWeight = 0.2;
    const confidenceWeight = 0.2;

    const lowestBonus = isLowestPrice ? 100 : 0;
    
    let score = (dropPercent * dropWeight) + 
                (product.discountPercent * discountWeight) + 
                (lowestBonus * lowestBonusWeight) +
                (confidenceScore * confidenceWeight);
    
    return Math.min(Math.round(score), 100);
  }
}

module.exports = DealEngine;
