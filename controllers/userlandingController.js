const Product = require("../models/Product");
const Deal = require("../models/Deal");
const Category = require("../models/Category");


// Featured products (Hero section)
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isFeatured: true,
      status: "active",
    }).limit(5);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Trending top deals
exports.getTopDeals = async (req, res) => {
  try {
    const products = await Product.find({
      isTopDeal: true,
      status: "active",
    }).limit(6);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Weekly deals
exports.getWeeklyDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      type: "weekly",
      isActive: true,
    }).populate("productId");

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Upcoming deals
exports.getUpcomingDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
    }).populate("productId");

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Trending categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().limit(8);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Recommended products
exports.getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      status: "active",
    })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};