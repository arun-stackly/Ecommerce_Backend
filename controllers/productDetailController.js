const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');


const getProductDetail = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const totalRatings = product.ratingCount || 0;
  const ratingStats = {
    average: product.rating || 0,
    total: totalRatings,
    fiveStar: Math.floor(totalRatings * 0.7),
    fourStar: Math.floor(totalRatings * 0.2),
    threeStar: Math.floor(totalRatings * 0.05),
    twoStar: Math.floor(totalRatings * 0.03),
    oneStar: Math.floor(totalRatings * 0.02),
  };

  const similar = await Product.find({
    category: product.category,
    _id: { $ne: product._id }
  }).sort({ rating: -1 }).limit(8);

  const accessories = await Product.find({
    category: { $in: ['Accessories', 'Chargers & Cables', 'Earphones & Headphones'] }
  }).limit(8);

  const bestSellers = await Product.find({
    category: product.category
  }).sort({ salesCount: -1, rating: -1 }).limit(8);

  res.json({
    product,
    ratingStats,
    similar,
    accessories,
    bestSellers
  });
});


const getSimilarProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const similar = await Product.find({
    category: product.category,
    price: { $gte: product.price * 0.8, $lte: product.price * 1.2 },
    _id: { $ne: product._id }
  }).limit(8);

  res.json(similar);
});


const getRecommendedProducts = asyncHandler(async (req, res) => {
  const { brand } = req.query;
  const recommended = await Product.aggregate([
    { $match: { brand: { $ne: brand } } },
    { $sample: { size: 6 } }
  ]);

  res.json(recommended);
});

module.exports = {
  getProductDetail,
  getSimilarProducts,
  getRecommendedProducts
};
