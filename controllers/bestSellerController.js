const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Deal = require('../models/Deal');


const getTopDealOfTheDay = asyncHandler(async (req, res) => {
  const now = new Date();
  const topDeal = await Deal.findOne({
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ discountPercent: -1 });

  if (!topDeal) {
    res.json({ message: 'No active deal today', deal: null });
  } else {
    res.json({ deal: topDeal });
  }
});


const getBestSellerSmartphones = asyncHandler(async (req, res) => {
  const brands = [
    'Apple', 'Samsung', 'Oppo', 'Vivo', 'Infinix',
    'Realme', 'Redmi', 'OnePlus', 'Poco', 'Honor'
  ];

  const results = {};
  for (const brand of brands) {
    const topProducts = await Product.find({ brand, category: 'Mobile Phones' })
      .sort({ salesCount: -1, rating: -1 })
      .limit(4)
      .select('-description');
    results[brand] = topProducts;
  }

  res.json(results);
});


const getAccessoryBestSellers = asyncHandler(async (req, res) => {
  const bestBrands = await Product.aggregate([
    { $match: { category: { $in: ['Accessories', 'Chargers & Cables', 'Earphones & Headphones', 'Phone Cases & Covers'] } } },
    { $group: { _id: '$brand', totalSales: { $sum: '$salesCount' } } },
    { $sort: { totalSales: -1 } },
    { $limit: 5 }
  ]);

  res.json({ bestBrands });
});

module.exports = { getTopDealOfTheDay, getBestSellerSmartphones, getAccessoryBestSellers };
