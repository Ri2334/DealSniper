const Product = require('../models/Product');
const Alert = require('../models/Alert');

exports.getProducts = async (req, res, next) => {
  try {
    const { keyword, brand, minDiscount, category, sortBy, page = 1, limit = 20 } = req.query;
    
    let query = {};

    if (keyword) query.name = { $regex: keyword, $options: 'i' };
    if (brand) query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    if (category) query.category = category;
    if (minDiscount) query.discountPercent = { $gte: Number(minDiscount) };

    let sortOption = { dealScore: -1 }; // Default sort by Deal Intelligence
    if (sortBy === 'price_asc') sortOption = { currentPrice: 1 };
    if (sortBy === 'price_desc') sortOption = { currentPrice: -1 };
    if (sortBy === 'discount_desc') sortOption = { discountPercent: -1 };
    if (sortBy === 'newest') sortOption = { lastUpdated: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Product.countDocuments(query);

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeDeals = await Product.countDocuments({ dealScore: { $gte: 70 } });
    const alertsSent = await Alert.countDocuments();
    
    // Time ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Top 10 Deals Today (by Deal Score)
    const topDealsToday = await Product.find({ 
      lastUpdated: { $gte: today },
      dealScore: { $gt: 0 }
    }).sort({ dealScore: -1 }).limit(10);

    // Top 10 Deals This Week (by Deal Score)
    const topDealsWeek = await Product.find({ 
      lastUpdated: { $gte: lastWeek },
      dealScore: { $gt: 0 }
    }).sort({ dealScore: -1 }).limit(10);

    // Top 10 Lowest Ever (hit lowest price recently, ranked by score)
    const topLowestEver = await Product.find({
      lastUpdated: { $gte: today },
      $expr: { $lte: ["$currentPrice", "$lowestPrice"] }
    }).sort({ dealScore: -1 }).limit(10);

    // Brand Breakdown
    const brandStats = await Product.aggregate([
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Category Breakdown
    const categoryStats = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average Deal Score
    const avgScoreResult = await Product.aggregate([
      { $match: { dealScore: { $gt: 0 } } },
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
