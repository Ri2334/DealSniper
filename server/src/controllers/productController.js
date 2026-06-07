const Product = require('../models/Product');
const Alert = require('../models/Alert');

exports.getProducts = async (req, res, next) => {
  try {
    const { 
      keyword, brand, category, gender, ageGroup, 
      minDiscount, maxDiscount, priceMin, priceMax, 
      dealScoreMin, dealScoreMax, lowestPriceOnly, hotDealsOnly, 
      newTodayOnly, sortBy, page = 1, limit = 20 
    } = req.query;
    
    // STALE CHECK: Hide products not seen in the last 48 hours (likely OOS/Removed)
    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - 48);

    let query = { 
        availability: true,
        lastUpdated: { $gte: staleThreshold }
    };

    if (req.query.showAll === 'true') {
        delete query.availability;
        delete query.lastUpdated;
    }

    if (keyword) query.name = { $regex: keyword, $options: 'i' };
    
    if (brand) query.brand = { $in: brand.split(',').map(b => new RegExp(`^${b.trim()}$`, 'i')) };
    if (category) query.category = { $in: category.split(',') };
    if (gender) query.gender = { $in: gender.split(',') };
    if (ageGroup) query.ageGroup = { $in: ageGroup.split(',') };
    if (req.query.sizes) query.sizes = { $in: req.query.sizes.split(',') };

    if (newTodayOnly === 'true') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.lastUpdated = { $gte: today };
    }


    if (minDiscount || maxDiscount) {
      query.discountPercent = {};
      if (minDiscount) query.discountPercent.$gte = Number(minDiscount);
      if (maxDiscount) query.discountPercent.$lte = Number(maxDiscount);
    }

    if (priceMin || priceMax) {
      query.currentPrice = {};
      if (priceMin && priceMin !== '0') query.currentPrice.$gte = Number(priceMin);
      if (priceMax && priceMax !== '0') query.currentPrice.$lte = Number(priceMax);
    }

    if (dealScoreMin || dealScoreMax || hotDealsOnly === 'true') {
      query.dealScore = {};
      if (dealScoreMin) query.dealScore.$gte = Number(dealScoreMin);
      if (dealScoreMax) query.dealScore.$lte = Number(dealScoreMax);
      if (hotDealsOnly === 'true') {
         query.dealScore.$gte = Math.max(Number(dealScoreMin || 0), 70);
      }
    }

    if (lowestPriceOnly === 'true') {
      query.$expr = { $lte: ["$currentPrice", "$lowestPrice"] };
    }

    let sortOption = { dealScore: -1 }; // Default sort by Deal Intelligence
    if (sortBy === 'price_asc') sortOption = { currentPrice: 1 };
    if (sortBy === 'price_desc') sortOption = { currentPrice: -1 };
    if (sortBy === 'discount_desc') sortOption = { discountPercent: -1 };
    if (sortBy === 'newest') sortOption = { lastUpdated: -1 };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit);
      
    const total = await Product.countDocuments(query);

    res.json({
      products,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      total
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter analytics by availability and stale threshold
    const staleThreshold = new Date();
    staleThreshold.setHours(staleThreshold.getHours() - 48);

    const baseQuery = { 
        availability: true,
        lastUpdated: { $gte: staleThreshold }
    };

    const totalProducts = await Product.countDocuments(baseQuery);
    const activeDeals = await Product.countDocuments({ ...baseQuery, dealScore: { $gte: 70 } });
    const alertsSent = await Alert.countDocuments();
    
    // Time ranges
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Top 10 Deals Today (by Deal Score)
    const topDealsToday = await Product.find({ 
      ...baseQuery,
      lastUpdated: { $gte: today },
      dealScore: { $gt: 0 }
    }).sort({ dealScore: -1 }).limit(10);

    // Top 10 Deals This Week (by Deal Score)
    const topDealsWeek = await Product.find({ 
      ...baseQuery,
      lastUpdated: { $gte: lastWeek },
      dealScore: { $gt: 0 }
    }).sort({ dealScore: -1 }).limit(10);

    // Top 10 Lowest Ever (hit lowest price recently, ranked by score)
    const topLowestEver = await Product.find({
      ...baseQuery,
      lastUpdated: { $gte: today },
      $expr: { $lte: ["$currentPrice", "$lowestPrice"] }
    }).sort({ dealScore: -1 }).limit(10);

    // Brand Breakdown
    const brandStats = await Product.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Category Breakdown
    const categoryStats = await Product.aggregate([
      { $match: baseQuery },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average Deal Score
    const avgScoreResult = await Product.aggregate([
      { $match: { ...baseQuery, dealScore: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$dealScore" } } }
    ]);
    const averageDealScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg) : 0;

    // Last crawl time
    const lastCrawlProduct = await Product.findOne().sort({ lastUpdated: -1 });
    const lastCrawl = lastCrawlProduct ? lastCrawlProduct.lastUpdated : null;

    res.json({
      totalProducts,
      activeDeals,
      alertsSent,
      topDealsToday,
      topDealsWeek,
      topLowestEver,
      brandStats,
      categoryStats,
      averageDealScore,
      lastCrawl
    });
  } catch (error) {
    next(error);
  }
};
